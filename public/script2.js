// Global variables
let currentPage = "dashboard";
let products = [];
let customers = [];
let invoices = [];
let editingProduct = null;
let editingCustomer = null;

// API Base URL
const API_BASE = "";

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeNavigation();
  loadDashboard();
  loadProducts();
  loadCustomers();
  loadInvoices();
});

// Navigation
function initializeNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const page = this.dataset.page;
      navigateToPage(page);
    });
  });
}

function navigateToPage(page) {
  // Update navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  document.querySelector(`[data-page="${page}"]`).classList.add("active");

  // Update page title
  const pageTitle = document.getElementById("page-title");
  const titles = {
    dashboard: "Dashboard",
    products: "Product Management",
    customers: "Customer Management",
    invoices: "Invoice Management",
    reports: "Reports & Analytics",
  };
  pageTitle.textContent = titles[page];

  // Show/hide pages
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
  });
  document.getElementById(page).classList.add("active");

  currentPage = page;
}

// Dashboard Functions
async function loadDashboard() {
  try {
    const [productsRes, customersRes, invoicesRes] = await Promise.all([
      fetch(`${API_BASE}/api/products`),
      fetch(`${API_BASE}/api/customers`),
      fetch(`${API_BASE}/api/invoices`),
    ]);

    const productsData = await productsRes.json();
    const customersData = await customersRes.json();
    const invoicesData = await invoicesRes.json();

    // Update stats
    document.getElementById("total-products").textContent = productsData.length;
    document.getElementById("total-customers").textContent =
      customersData.length;
    document.getElementById("total-invoices").textContent = invoicesData.length;

    // Calculate total revenue
    const totalRevenue = invoicesData.reduce(
      (sum, invoice) => sum + invoice.final_amount,
      0
    );
    document.getElementById(
      "total-revenue"
    ).textContent = `₹${totalRevenue.toLocaleString()}`;

    // Load recent sales
    loadRecentSales();
    loadLowStockAlert();
  } catch (error) {
    console.error("Error loading dashboard:", error);
    showMessage("Error loading dashboard data", "error");
  }
}

async function loadRecentSales() {
  try {
    const response = await fetch(`${API_BASE}/api/reports/sales`);
    const salesData = await response.json();

    const recentSales = salesData.slice(0, 5);
    const container = document.getElementById("recent-sales-chart");

    if (recentSales.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><i class="fas fa-chart-line"></i><h3>No recent sales</h3></div>';
      return;
    }

    let html = '<div class="recent-sales-list">';
    recentSales.forEach((sale) => {
      html += `
                <div class="sale-item">
                    <div class="sale-info">
                        <strong>${sale.product_name}</strong>
                        <span>${sale.customer_name}</span>
                    </div>
                    <div class="sale-amount">₹${sale.total_price}</div>
                </div>
            `;
    });
    html += "</div>";
    container.innerHTML = html;
  } catch (error) {
    console.error("Error loading recent sales:", error);
  }
}

async function loadLowStockAlert() {
  try {
    const response = await fetch(`${API_BASE}/api/reports/inventory`);
    const inventoryData = await response.json();

    const lowStock = inventoryData.filter((item) => item.stock_quantity < 5);
    const container = document.getElementById("low-stock-alert");

    if (lowStock.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><i class="fas fa-check-circle"></i><h3>All items in stock</h3></div>';
      return;
    }

    let html = '<div class="low-stock-list">';
    lowStock.forEach((item) => {
      html += `
                <div class="stock-item">
                    <div class="stock-info">
                        <strong>${item.name}</strong>
                        <span>Stock: ${item.stock_quantity}</span>
                    </div>
                    <div class="stock-status low">Low Stock</div>
                </div>
            `;
    });
    html += "</div>";
    container.innerHTML = html;
  } catch (error) {
    console.error("Error loading low stock alert:", error);
  }
}

// Products Functions
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    products = await response.json();
    displayProducts();
  } catch (error) {
    console.error("Error loading products:", error);
    showMessage("Error loading products", "error");
  }
}

function displayProducts() {
  const tbody = document.getElementById("products-tbody");

  if (products.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="empty-state"><i class="fas fa-box"></i><h3>No products found</h3></td></tr>';
    return;
  }

  tbody.innerHTML = products
    .map(
      (product) => `
        <tr>
            <td>${product.name}</td>
            <td>${product.category || "-"}</td>
            <td>${product.weight ? `${product.weight}g` : "-"}</td>
            <td>${product.purity || "-"}</td>
            <td>₹${product.price.toLocaleString()}</td>
            <td>
                <span class="stock-badge ${
                  product.stock_quantity < 5 ? "low" : "normal"
                }">
                    ${product.stock_quantity}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="editProduct(${
                      product.id
                    })">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${
                      product.id
                    })">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");
}

// Product Modal Functions
function openProductModal(product = null) {
  editingProduct = product;
  const modal = document.getElementById("product-modal");
  const title = document.getElementById("product-modal-title");

  if (product) {
    title.textContent = "Edit Product";
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-description").value =
      product.description || "";
    document.getElementById("product-category").value =
      product.category || "Gold";
    document.getElementById("product-weight").value = product.weight || "";
    document.getElementById("product-purity").value = product.purity || "24K";
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-stock").value = product.stock_quantity;
  } else {
    title.textContent = "Add Product";
    document.getElementById("product-form").reset();
  }

  modal.style.display = "block";
}

function closeProductModal() {
  document.getElementById("product-modal").style.display = "none";
  editingProduct = null;
}

// Product Form Submission
document
  .getElementById("product-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById("product-name").value,
      description: document.getElementById("product-description").value,
      category: document.getElementById("product-category").value,
      weight:
        parseFloat(document.getElementById("product-weight").value) || null,
      purity: document.getElementById("product-purity").value,
      price: parseFloat(document.getElementById("product-price").value),
      stock_quantity: parseInt(document.getElementById("product-stock").value),
    };

    try {
      const url = editingProduct
        ? `${API_BASE}/api/products/${editingProduct.id}`
        : `${API_BASE}/api/products`;

      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showMessage(
          editingProduct
            ? "Product updated successfully"
            : "Product added successfully",
          "success"
        );
        closeProductModal();
        loadProducts();
        if (currentPage === "dashboard") loadDashboard();
      } else {
        throw new Error("Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      showMessage("Error saving product", "error");
    }
  });

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const response = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showMessage("Product deleted successfully", "success");
      loadProducts();
      if (currentPage === "dashboard") loadDashboard();
    } else {
      throw new Error("Failed to delete product");
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    showMessage("Error deleting product", "error");
  }
}

function editProduct(id) {
  const product = products.find((p) => p.id === id);
  if (product) {
    openProductModal(product);
  }
}

// Customers Functions
async function loadCustomers() {
  try {
    const response = await fetch(`${API_BASE}/api/customers`);
    customers = await response.json();
    displayCustomers();
  } catch (error) {
    console.error("Error loading customers:", error);
    showMessage("Error loading customers", "error");
  }
}

function displayCustomers() {
  const tbody = document.getElementById("customers-tbody");

  if (customers.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="empty-state"><i class="fas fa-users"></i><h3>No customers found</h3></td></tr>';
    return;
  }

  tbody.innerHTML = customers
    .map(
      (customer) => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.email || "-"}</td>
            <td>${customer.phone || "-"}</td>
            <td>${customer.gst_number || "-"}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="editCustomer(${
                      customer.id
                    })">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");
}

// Customer Modal Functions
function openCustomerModal(customer = null) {
  editingCustomer = customer;
  const modal = document.getElementById("customer-modal");
  const title = document.getElementById("customer-modal-title");

  if (customer) {
    title.textContent = "Edit Customer";
    document.getElementById("customer-name").value = customer.name;
    document.getElementById("customer-email").value = customer.email || "";
    document.getElementById("customer-phone").value = customer.phone || "";
    document.getElementById("customer-address").value = customer.address || "";
    document.getElementById("customer-gst").value = customer.gst_number || "";
  } else {
    title.textContent = "Add Customer";
    document.getElementById("customer-form").reset();
  }

  modal.style.display = "block";
}

function closeCustomerModal() {
  document.getElementById("customer-modal").style.display = "none";
  editingCustomer = null;
}

// Customer Form Submission
document
  .getElementById("customer-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById("customer-name").value,
      email: document.getElementById("customer-email").value,
      phone: document.getElementById("customer-phone").value,
      address: document.getElementById("customer-address").value,
      gst_number: document.getElementById("customer-gst").value,
    };

    try {
      const response = await fetch(`${API_BASE}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showMessage("Customer added successfully", "success");
        closeCustomerModal();
        loadCustomers();
        if (currentPage === "dashboard") loadDashboard();
      } else {
        throw new Error("Failed to save customer");
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      showMessage("Error saving customer", "error");
    }
  });

function editCustomer(id) {
  const customer = customers.find((c) => c.id === id);
  if (customer) {
    openCustomerModal(customer);
  }
}

// Invoices Functions
async function loadInvoices() {
  try {
    const response = await fetch(`${API_BASE}/api/invoices`);
    invoices = await response.json();
    displayInvoices();
  } catch (error) {
    console.error("Error loading invoices:", error);
    showMessage("Error loading invoices", "error");
  }
}

function displayInvoices() {
  const tbody = document.getElementById("invoices-tbody");

  if (invoices.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state"><i class="fas fa-file-invoice"></i><h3>No invoices found</h3></td></tr>';
    return;
  }

  tbody.innerHTML = invoices
    .map(
      (invoice) => `
        <tr>
            <td>${invoice.invoice_number}</td>
            <td>${invoice.customer_name || "Unknown"}</td>
            <td>₹${invoice.final_amount.toLocaleString()}</td>
            <td>${new Date(invoice.invoice_date).toLocaleDateString()}</td>
            <td>
                <span class="status-badge status-${invoice.payment_status}">
                    ${invoice.payment_status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="viewInvoice(${
                      invoice.id
                    })">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");
}

// Invoice Modal Functions
function openInvoiceModal() {
  const modal = document.getElementById("invoice-modal");
  modal.style.display = "block";

  // Load customers for dropdown
  loadCustomerOptions();

  // Initialize invoice items
  document.getElementById("invoice-items-list").innerHTML = "";
  addInvoiceItem();

  // Reset form
  document.getElementById("invoice-form").reset();
  document.getElementById("invoice-tax").value = "18";
  document.getElementById("invoice-discount").value = "0";
}

function closeInvoiceModal() {
  document.getElementById("invoice-modal").style.display = "none";
}

function loadCustomerOptions() {
  const select = document.getElementById("invoice-customer");
  select.innerHTML = '<option value="">Select Customer</option>';

  customers.forEach((customer) => {
    const option = document.createElement("option");
    option.value = customer.id;
    option.textContent = customer.name;
    select.appendChild(option);
  });
}

function addInvoiceItem() {
  const container = document.getElementById("invoice-items-list");
  const itemId = Date.now();

  const itemHtml = `
        <div class="invoice-item" data-item-id="${itemId}">
            <select class="product-select" onchange="updateItemPrice(${itemId})">
                <option value="">Select Product</option>
                ${products
                  .map(
                    (product) => `
                    <option value="${product.id}" data-price="${product.price}">
                        ${product.name} - ₹${product.price}
                    </option>
                `
                  )
                  .join("")}
            </select>
            <input type="number" class="quantity-input" value="1" min="1" onchange="updateItemTotal(${itemId})">
            <input type="number" class="unit-price-input" readonly>
            <input type="number" class="total-price-input" readonly>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeInvoiceItem(${itemId})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

  container.insertAdjacentHTML("beforeend", itemHtml);
}

function removeInvoiceItem(itemId) {
  const item = document.querySelector(`[data-item-id="${itemId}"]`);
  if (item) {
    item.remove();
    calculateInvoiceTotals();
  }
}

function updateItemPrice(itemId) {
  const item = document.querySelector(`[data-item-id="${itemId}"]`);
  const productSelect = item.querySelector(".product-select");
  const unitPriceInput = item.querySelector(".unit-price-input");
  const selectedOption = productSelect.selectedOptions[0];

  if (selectedOption && selectedOption.dataset.price) {
    unitPriceInput.value = selectedOption.dataset.price;
    updateItemTotal(itemId);
  }
}

function updateItemTotal(itemId) {
  const item = document.querySelector(`[data-item-id="${itemId}"]`);
  const quantityInput = item.querySelector(".quantity-input");
  const unitPriceInput = item.querySelector(".unit-price-input");
  const totalPriceInput = item.querySelector(".total-price-input");

  const quantity = parseFloat(quantityInput.value) || 0;
  const unitPrice = parseFloat(unitPriceInput.value) || 0;
  const total = quantity * unitPrice;

  totalPriceInput.value = total.toFixed(2);
  calculateInvoiceTotals();
}

function calculateInvoiceTotals() {
  const items = document.querySelectorAll(".invoice-item");
  let subtotal = 0;

  items.forEach((item) => {
    const totalInput = item.querySelector(".total-price-input");
    subtotal += parseFloat(totalInput.value) || 0;
  });

  const taxPercent =
    parseFloat(document.getElementById("invoice-tax").value) || 0;
  const discountPercent =
    parseFloat(document.getElementById("invoice-discount").value) || 0;

  const taxAmount = subtotal * (taxPercent / 100);
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal + taxAmount - discountAmount;

  document.getElementById(
    "invoice-subtotal"
  ).textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById(
    "invoice-tax-amount"
  ).textContent = `₹${taxAmount.toFixed(2)}`;
  document.getElementById(
    "invoice-discount-amount"
  ).textContent = `₹${discountAmount.toFixed(2)}`;
  document.getElementById("invoice-total").textContent = `₹${total.toFixed(2)}`;
}

// Invoice Form Submission
document
  .getElementById("invoice-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const customerId = document.getElementById("invoice-customer").value;
    const notes = document.getElementById("invoice-notes").value;

    if (!customerId) {
      showMessage("Please select a customer", "error");
      return;
    }

    const items = [];
    const itemElements = document.querySelectorAll(".invoice-item");

    itemElements.forEach((item) => {
      const productId = item.querySelector(".product-select").value;
      const quantity = parseFloat(item.querySelector(".quantity-input").value);
      const unitPrice = parseFloat(
        item.querySelector(".unit-price-input").value
      );
      const totalPrice = parseFloat(
        item.querySelector(".total-price-input").value
      );

      if (productId && quantity && unitPrice) {
        items.push({
          product_id: parseInt(productId),
          quantity: quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        });
      }
    });

    if (items.length === 0) {
      showMessage("Please add at least one item", "error");
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const taxPercent =
      parseFloat(document.getElementById("invoice-tax").value) || 0;
    const discountPercent =
      parseFloat(document.getElementById("invoice-discount").value) || 0;

    const taxAmount = subtotal * (taxPercent / 100);
    const discountAmount = subtotal * (discountPercent / 100);
    const finalAmount = subtotal + taxAmount - discountAmount;

    const invoiceData = {
      customer_id: parseInt(customerId),
      items: items,
      total_amount: subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      notes: notes,
    };

    try {
      const response = await fetch(`${API_BASE}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(
          `Invoice created successfully! Invoice #: ${result.invoice_number}`,
          "success"
        );
        closeInvoiceModal();
        loadInvoices();
        if (currentPage === "dashboard") loadDashboard();
      } else {
        throw new Error("Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      showMessage("Error creating invoice", "error");
    }
  });

async function viewInvoice(id) {
  try {
    const response = await fetch(`${API_BASE}/api/invoices/${id}`);
    const invoice = await response.json();

    // Set current invoice ID for PDF download
    currentInvoiceId = id;

    // Show download button
    document.getElementById("download-pdf-btn").style.display = "inline-flex";

    // Update modal title
    document.getElementById(
      "invoice-view-modal-title"
    ).textContent = `Invoice #${invoice.invoice_number}`;

    // Create invoice view content
    const content = document.getElementById("invoice-view-content");
    content.innerHTML = `
      <div class="invoice-view-header">
        <div class="invoice-info">
          <div class="info-row">
            <strong>Invoice Number:</strong> ${invoice.invoice_number}
          </div>
          <div class="info-row">
            <strong>Date:</strong> ${new Date(
              invoice.invoice_date
            ).toLocaleDateString()}
          </div>
          <div class="info-row">
            <strong>Status:</strong> 
            <select id="invoice-status-select" onchange="updateInvoiceStatus(${
              invoice.id
            }, this.value)">
              <option value="pending" ${
                invoice.payment_status === "pending" ? "selected" : ""
              }>Pending</option>
              <option value="paid" ${
                invoice.payment_status === "paid" ? "selected" : ""
              }>Paid</option>
              <option value="cancelled" ${
                invoice.payment_status === "cancelled" ? "selected" : ""
              }>Cancelled</option>
              <option value="overdue" ${
                invoice.payment_status === "overdue" ? "selected" : ""
              }>Overdue</option>
            </select>
          </div>
        </div>
        <div class="customer-info">
          <h4>Customer Information</h4>
          <div class="info-row">
            <strong>Name:</strong> ${invoice.customer_name || "N/A"}
          </div>
          <div class="info-row">
            <strong>Email:</strong> ${invoice.email || "N/A"}
          </div>
          <div class="info-row">
            <strong>Phone:</strong> ${invoice.phone || "N/A"}
          </div>
          <div class="info-row">
            <strong>Address:</strong> ${invoice.address || "N/A"}
          </div>
          <div class="info-row">
            <strong>GST Number:</strong> ${invoice.gst_number || "N/A"}
          </div>
        </div>
      </div>

      <div class="invoice-items-view">
        <h4>Invoice Items</h4>
        <table class="invoice-items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Description</th>
              <th>Category</th>
              <th>Weight</th>
              <th>Purity</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.description || "-"}</td>
                <td>${item.category || "-"}</td>
                <td>${item.weight ? `${item.weight}g` : "-"}</td>
                <td>${item.purity || "-"}</td>
                <td>${item.quantity}</td>
                <td>₹${item.unit_price.toLocaleString()}</td>
                <td>₹${item.total_price.toLocaleString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="invoice-summary-view">
        <h4>Invoice Summary</h4>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>₹${invoice.total_amount.toLocaleString()}</span>
        </div>
        <div class="summary-row">
          <span>Tax Amount:</span>
          <span>₹${invoice.tax_amount.toLocaleString()}</span>
        </div>
        <div class="summary-row">
          <span>Discount Amount:</span>
          <span>₹${invoice.discount_amount.toLocaleString()}</span>
        </div>
        <div class="summary-row total">
          <span>Final Amount:</span>
          <span>₹${invoice.final_amount.toLocaleString()}</span>
        </div>
        ${
          invoice.notes
            ? `
          <div class="invoice-notes">
            <h4>Notes</h4>
            <p>${invoice.notes}</p>
          </div>
        `
            : ""
        }
      </div>
    `;

    // Show the modal
    document.getElementById("invoice-view-modal").style.display = "block";
  } catch (error) {
    console.error("Error loading invoice:", error);
    showMessage("Error loading invoice details", "error");
  }
}

function closeInvoiceViewModal() {
  document.getElementById("invoice-view-modal").style.display = "none";
  // Hide download button and reset current invoice ID
  document.getElementById("download-pdf-btn").style.display = "none";
  currentInvoiceId = null;
}

async function updateInvoiceStatus(invoiceId, newStatus) {
  try {
    const response = await fetch(
      `${API_BASE}/api/invoices/${invoiceId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payment_status: newStatus }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update invoice status");
    }

    const result = await response.json();
    showMessage(result.message, "success");

    // Reload invoices to update the display
    loadInvoices();
  } catch (error) {
    console.error("Error updating invoice status:", error);
    showMessage("Error updating invoice status", "error");

    // Reset the select to the previous value
    const select = document.getElementById("invoice-status-select");
    const currentInvoice = invoices.find((inv) => inv.id == invoiceId);
    if (currentInvoice) {
      select.value = currentInvoice.payment_status;
    }
  }
}

// Global variable to store current invoice ID for PDF download
let currentInvoiceId = null;

async function downloadInvoicePDF() {
  if (!currentInvoiceId) {
    showMessage("No invoice selected for PDF download", "error");
    return;
  }

  try {
    // Show loading message
    showMessage("Generating PDF...", "info");

    // Create a temporary link to download the PDF
    const link = document.createElement("a");
    link.href = `${API_BASE}/api/invoices/${currentInvoiceId}/pdf`;
    link.download = `Invoice-${currentInvoiceId}.pdf`;
    link.target = "_blank";

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showMessage("PDF download started", "success");
  } catch (error) {
    console.error("Error downloading PDF:", error);
    showMessage("Error downloading PDF", "error");
  }
}

// Reports Functions
async function generateSalesReport() {
  const startDate = document.getElementById("sales-start-date").value;
  const endDate = document.getElementById("sales-end-date").value;

  if (!startDate || !endDate) {
    showMessage("Please select start and end dates", "error");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/reports/sales?start_date=${startDate}&end_date=${endDate}`
    );
    const salesData = await response.json();

    const container = document.getElementById("sales-report-content");

    if (salesData.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><i class="fas fa-chart-line"></i><h3>No sales data found</h3></div>';
      return;
    }

    const totalRevenue = salesData.reduce(
      (sum, sale) => sum + sale.total_price,
      0
    );
    const totalQuantity = salesData.reduce(
      (sum, sale) => sum + sale.quantity,
      0
    );

    let html = `
            <div class="report-summary">
                <div class="summary-item">
                    <strong>Total Sales:</strong> ${salesData.length}
                </div>
                <div class="summary-item">
                    <strong>Total Revenue:</strong> ₹${totalRevenue.toLocaleString()}
                </div>
                <div class="summary-item">
                    <strong>Total Quantity:</strong> ${totalQuantity}
                </div>
            </div>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Customer</th>
                        <th>Quantity</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
        `;

    salesData.forEach((sale) => {
      html += `
                <tr>
                    <td>${new Date(sale.sale_date).toLocaleDateString()}</td>
                    <td>${sale.product_name}</td>
                    <td>${sale.customer_name}</td>
                    <td>${sale.quantity}</td>
                    <td>₹${sale.total_price}</td>
                </tr>
            `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
  } catch (error) {
    console.error("Error generating sales report:", error);
    showMessage("Error generating sales report", "error");
  }
}

async function generateInventoryReport() {
  try {
    const response = await fetch(`${API_BASE}/api/reports/inventory`);
    const inventoryData = await response.json();

    const container = document.getElementById("inventory-report-content");

    if (inventoryData.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><i class="fas fa-box"></i><h3>No inventory data found</h3></div>';
      return;
    }

    let html = `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Sold Quantity</th>
                        <th>Total Quantity</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

    inventoryData.forEach((item) => {
      const status = item.stock_quantity < 5 ? "Low Stock" : "In Stock";
      const statusClass = item.stock_quantity < 5 ? "low" : "normal";

      html += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.category || "-"}</td>
                    <td>${item.stock_quantity}</td>
                    <td>${item.sold_quantity}</td>
                    <td>${item.total_quantity}</td>
                    <td><span class="status-badge status-${statusClass}">${status}</span></td>
                </tr>
            `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
  } catch (error) {
    console.error("Error generating inventory report:", error);
    showMessage("Error generating inventory report", "error");
  }
}

// Utility Functions
function showMessage(message, type = "info") {
  // Remove existing messages
  const existingMessages = document.querySelectorAll(".message");
  existingMessages.forEach((msg) => msg.remove());

  // Create new message
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.innerHTML = `
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "exclamation-circle"
            : "info-circle"
        }"></i>
        <span>${message}</span>
    `;

  // Insert at the top of the main content
  const mainContent = document.querySelector(".main-content");
  mainContent.insertBefore(messageDiv, mainContent.firstChild);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}

// Event Listeners for Invoice Calculations
document
  .getElementById("invoice-tax")
  .addEventListener("input", calculateInvoiceTotals);
document
  .getElementById("invoice-discount")
  .addEventListener("input", calculateInvoiceTotals);

// Close modals when clicking outside
window.addEventListener("click", function (event) {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

// Add some CSS for the new elements
const additionalStyles = `
    .recent-sales-list, .low-stock-list {
        max-height: 300px;
        overflow-y: auto;
    }
    
    .sale-item, .stock-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #f1f3f4;
    }
    
    .sale-item:last-child, .stock-item:last-child {
        border-bottom: none;
    }
    
    .sale-info, .stock-info {
        display: flex;
        flex-direction: column;
    }
    
    .sale-info strong, .stock-info strong {
        font-weight: 600;
        color: #333;
    }
    
    .sale-info span, .stock-info span {
        font-size: 0.8rem;
        color: #666;
    }
    
    .sale-amount {
        font-weight: 600;
        color: #667eea;
    }
    
    .stock-status {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 500;
    }
    
    .stock-status.low {
        background: #f8d7da;
        color: #721c24;
    }
    
    .stock-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .stock-badge.low {
        background: #f8d7da;
        color: #721c24;
    }
    
    .stock-badge.normal {
        background: #d4edda;
        color: #155724;
    }
    
    .report-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
    }
    
    .summary-item {
        text-align: center;
    }
    
    .report-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
    }
    
    .report-table th,
    .report-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #dee2e6;
    }
    
    .report-table th {
        background: #f8f9fa;
        font-weight: 600;
    }
`;

// Inject additional styles
const styleSheet = document.createElement("style");
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
