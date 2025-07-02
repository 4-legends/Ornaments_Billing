const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const moment = require("moment");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Database setup
const db = new sqlite3.Database("ornaments_billing.db");

// Initialize database tables
db.serialize(() => {
  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    weight REAL,
    purity TEXT,
    price REAL NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Customers table
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    gst_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Invoices table
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    total_amount REAL NOT NULL,
    tax_amount REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    final_amount REAL NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  )`);

  // Invoice items table
  db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  // Sales table for tracking
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    unit_price REAL,
    total_price REAL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);
});

// Generate unique invoice number
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `INV-${year}${month}${day}-${random}`;
}

// API Routes

// Products API
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/products", (req, res) => {
  const { name, description, category, weight, purity, price, stock_quantity } =
    req.body;
  const sql = `INSERT INTO products (name, description, category, weight, purity, price, stock_quantity) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(
    sql,
    [name, description, category, weight, purity, price, stock_quantity],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: "Product added successfully" });
    }
  );
});

app.put("/api/products/:id", (req, res) => {
  const { name, description, category, weight, purity, price, stock_quantity } =
    req.body;
  const sql = `UPDATE products SET name=?, description=?, category=?, weight=?, purity=?, price=?, stock_quantity=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`;

  db.run(
    sql,
    [
      name,
      description,
      category,
      weight,
      purity,
      price,
      stock_quantity,
      req.params.id,
    ],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: "Product updated successfully" });
    }
  );
});

app.delete("/api/products/:id", (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", req.params.id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: "Product deleted successfully" });
  });
});

// Customers API
app.get("/api/customers", (req, res) => {
  db.all("SELECT * FROM customers ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/customers", (req, res) => {
  const { name, email, phone, address, gst_number } = req.body;
  const sql = `INSERT INTO customers (name, email, phone, address, gst_number) VALUES (?, ?, ?, ?, ?)`;

  db.run(sql, [name, email, phone, address, gst_number], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: "Customer added successfully" });
  });
});

// Invoices API
app.get("/api/invoices", (req, res) => {
  const sql = `SELECT i.*, c.name as customer_name 
                FROM invoices i 
                LEFT JOIN customers c ON i.customer_id = c.id 
                ORDER BY i.invoice_date DESC`;

  db.all(sql, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/invoices", (req, res) => {
  const {
    customer_id,
    items,
    total_amount,
    tax_amount,
    discount_amount,
    final_amount,
    notes,
  } = req.body;
  const invoice_number = generateInvoiceNumber();

  db.run(`BEGIN TRANSACTION`);

  const invoiceSql = `INSERT INTO invoices (invoice_number, customer_id, total_amount, tax_amount, discount_amount, final_amount, notes) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(
    invoiceSql,
    [
      invoice_number,
      customer_id,
      total_amount,
      tax_amount,
      discount_amount,
      final_amount,
      notes,
    ],
    function (err) {
      if (err) {
        db.run("ROLLBACK");
        res.status(500).json({ error: err.message });
        return;
      }

      const invoice_id = this.lastID;
      let itemsProcessed = 0;

      items.forEach((item, index) => {
        const itemSql = `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, total_price) 
                       VALUES (?, ?, ?, ?, ?)`;

        db.run(
          itemSql,
          [
            invoice_id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.total_price,
          ],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              res.status(500).json({ error: err.message });
              return;
            }

            // Update stock quantity
            db.run(
              `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
              [item.quantity, item.product_id]
            );

            // Add to sales tracking
            db.run(
              `INSERT INTO sales (invoice_id, product_id, quantity, unit_price, total_price) 
                VALUES (?, ?, ?, ?, ?)`,
              [
                invoice_id,
                item.product_id,
                item.quantity,
                item.unit_price,
                item.total_price,
              ]
            );

            itemsProcessed++;
            if (itemsProcessed === items.length) {
              db.run("COMMIT");
              res.json({
                id: invoice_id,
                invoice_number: invoice_number,
                message: "Invoice created successfully",
              });
            }
          }
        );
      });
    }
  );
});

app.get("/api/invoices/:id", (req, res) => {
  const sql = `SELECT i.*, c.name as customer_name, c.email, c.phone, c.address, c.gst_number
                FROM invoices i 
                LEFT JOIN customers c ON i.customer_id = c.id 
                WHERE i.id = ?`;

  db.get(sql, [req.params.id], (err, invoice) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    // Get invoice items
    const itemsSql = `SELECT ii.*, p.name as product_name, p.description, p.category, p.weight, p.purity
                      FROM invoice_items ii 
                      LEFT JOIN products p ON ii.product_id = p.id 
                      WHERE ii.invoice_id = ?`;

    db.all(itemsSql, [req.params.id], (err, items) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({ ...invoice, items });
    });
  });
});

// Update invoice status
app.put("/api/invoices/:id/status", (req, res) => {
  const { payment_status } = req.body;

  if (
    !payment_status ||
    !["pending", "paid", "cancelled", "overdue"].includes(payment_status)
  ) {
    res.status(400).json({
      error:
        "Invalid payment status. Must be one of: pending, paid, cancelled, overdue",
    });
    return;
  }

  const sql = `UPDATE invoices SET payment_status = ? WHERE id = ?`;

  db.run(sql, [payment_status, req.params.id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    res.json({ message: "Invoice status updated successfully" });
  });
});

// Generate PDF for invoice
app.get("/api/invoices/:id/pdf", (req, res) => {
  const sql = `SELECT i.*, c.name as customer_name, c.email, c.phone, c.address, c.gst_number
                FROM invoices i 
                LEFT JOIN customers c ON i.customer_id = c.id 
                WHERE i.id = ?`;

  db.get(sql, [req.params.id], (err, invoice) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    // Get invoice items
    const itemsSql = `SELECT ii.*, p.name as product_name, p.description, p.category, p.weight, p.purity
                      FROM invoice_items ii 
                      LEFT JOIN products p ON ii.product_id = p.id 
                      WHERE ii.invoice_id = ?`;

    db.all(itemsSql, [req.params.id], (err, items) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Generate PDF
      generateInvoicePDF(invoice, items, res);
    });
  });
});

// Function to generate PDF
function generateInvoicePDF(invoice, items, res) {
  const doc = new PDFDocument({ margin: 50 });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`
  );

  // Pipe PDF to response
  doc.pipe(res);

  // Add company header
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("ORNAMENTS BILLING SYSTEM", { align: "center" });

  doc
    .fontSize(12)
    .font("Helvetica")
    .text("Professional Jewellery & Ornaments", { align: "center" })
    .text("123 Jewellery Street, City - 123456", { align: "center" })
    .text("Phone: +91 9876543210 | Email: info@ornaments.com", {
      align: "center",
    })
    .text("GST: 27ABCDE1234F1Z5", { align: "center" })
    .moveDown(2);

  // Invoice header
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("INVOICE", { align: "center" })
    .moveDown();

  // Invoice details section
  let y = doc.y;
  doc.fontSize(12).font("Helvetica-Bold").text("Invoice Details:", 50, y);
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Invoice Number: ${invoice.invoice_number}`, 50, y + 18)
    .text(
      `Date: ${moment(invoice.invoice_date).format("DD/MM/YYYY")}`,
      50,
      y + 33
    )
    .text(`Status: ${invoice.payment_status.toUpperCase()}`, 50, y + 48);

  doc.fontSize(12).font("Helvetica-Bold").text("Bill To:", 330, y);
  let cy = y + 18;
  doc.fontSize(10).font("Helvetica").text(invoice.customer_name, 330, cy);
  cy += 15;
  if (invoice.address) {
    doc.text(invoice.address, 330, cy);
    cy += 15;
  }
  if (invoice.phone) {
    doc.text(`Phone: ${invoice.phone}`, 330, cy);
    cy += 15;
  }
  if (invoice.email) {
    doc.text(`Email: ${invoice.email}`, 330, cy);
    cy += 15;
  }
  if (invoice.gst_number) {
    doc.text(`GST: ${invoice.gst_number}`, 330, cy);
    cy += 15;
  }

  doc.moveDown(3);
  y = doc.y + 10;

  // Table columns
  const columns = [
    { label: "Item", width: 70 },
    { label: "Description", width: 100 },
    { label: "Category", width: 60 },
    { label: "Weight", width: 50 },
    { label: "Purity", width: 45 },
    { label: "Qty", width: 30 },
    { label: "Unit Price", width: 70 },
    { label: "Total", width: 70 },
  ];
  const startX = 50;
  let tableY = y;

  // Table header
  doc.fontSize(11).font("Helvetica-Bold");
  let x = startX;
  columns.forEach((col) => {
    doc.text(col.label, x, tableY, { width: col.width, align: "left" });
    x += col.width;
  });
  // Draw header line
  doc
    .moveTo(startX, tableY + 15)
    .lineTo(startX + columns.reduce((a, c) => a + c.width, 0), tableY + 15)
    .stroke();

  // Table rows
  let rowY = tableY + 22;
  doc.fontSize(10).font("Helvetica");
  items.forEach((item) => {
    x = startX;
    doc.text(item.product_name || "N/A", x, rowY, { width: columns[0].width });
    x += columns[0].width;
    doc.text(item.description || "N/A", x, rowY, { width: columns[1].width });
    x += columns[1].width;
    doc.text(item.category || "N/A", x, rowY, { width: columns[2].width });
    x += columns[2].width;
    doc.text(item.weight ? `${item.weight}g` : "N/A", x, rowY, {
      width: columns[3].width,
    });
    x += columns[3].width;
    doc.text(item.purity || "N/A", x, rowY, { width: columns[4].width });
    x += columns[4].width;
    doc.text(item.quantity.toString(), x, rowY, {
      width: columns[5].width,
      align: "right",
    });
    x += columns[5].width;
    doc.text(`₹${item.unit_price.toLocaleString()}`, x, rowY, {
      width: columns[6].width,
      align: "right",
    });
    x += columns[6].width;
    doc.text(`₹${item.total_price.toLocaleString()}`, x, rowY, {
      width: columns[7].width,
      align: "right",
    });
    rowY += 18;
    // Add page break if needed
    if (rowY > 700) {
      doc.addPage();
      rowY = 50;
    }
  });
  // Draw bottom line
  doc
    .moveTo(startX, rowY)
    .lineTo(startX + columns.reduce((a, c) => a + c.width, 0), rowY)
    .stroke();

  // Summary box
  let summaryBoxY = rowY + 20;
  let summaryBoxX =
    startX + columns.slice(0, -3).reduce((a, c) => a + c.width, 0) + 10;
  let boxWidth = columns.slice(-3).reduce((a, c) => a + c.width, 0) + 30;
  let boxHeight = 70;
  doc.roundedRect(summaryBoxX, summaryBoxY, boxWidth, boxHeight, 8).stroke();
  let sy = summaryBoxY + 10;
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Summary:", summaryBoxX + 10, sy);
  sy += 18;
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(
      `Subtotal: ₹${invoice.total_amount.toLocaleString()}`,
      summaryBoxX + 10,
      sy
    );
  sy += 15;
  doc.text(
    `Tax (${((invoice.tax_amount / invoice.total_amount) * 100).toFixed(
      1
    )}%): ₹${invoice.tax_amount.toLocaleString()}`,
    summaryBoxX + 10,
    sy
  );
  sy += 15;
  doc.text(
    `Discount: ₹${invoice.discount_amount.toLocaleString()}`,
    summaryBoxX + 10,
    sy
  );
  sy += 15;
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(
      `Total: ₹${invoice.final_amount.toLocaleString()}`,
      summaryBoxX + 10,
      sy
    );

  // Notes section
  if (invoice.notes) {
    doc.moveDown(2);
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Notes:", startX, sy + 40);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(invoice.notes, startX, sy + 58, { width: 350 });
  }

  // Footer
  doc.moveDown(6);
  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Thank you for your business!", { align: "center" })
    .text("This is a computer generated invoice", { align: "center" });

  // Finalize PDF
  doc.end();
}

// Reports API
app.get("/api/reports/sales", (req, res) => {
  const { start_date, end_date } = req.query;
  let sql = `SELECT s.*, p.name as product_name, i.invoice_number, c.name as customer_name
              FROM sales s 
              LEFT JOIN products p ON s.product_id = p.id 
              LEFT JOIN invoices i ON s.invoice_id = i.id 
              LEFT JOIN customers c ON i.customer_id = c.id`;

  const params = [];
  if (start_date && end_date) {
    sql += ` WHERE s.sale_date BETWEEN ? AND ?`;
    params.push(start_date, end_date);
  }

  sql += ` ORDER BY s.sale_date DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get("/api/reports/inventory", (req, res) => {
  const sql = `SELECT p.*, 
                COALESCE(SUM(s.quantity), 0) as sold_quantity,
                (p.stock_quantity + COALESCE(SUM(s.quantity), 0)) as total_quantity
                FROM products p 
                LEFT JOIN sales s ON p.id = s.product_id 
                GROUP BY p.id 
                ORDER BY p.stock_quantity ASC`;

  db.all(sql, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Serve the main application
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Ornaments Billing System running on http://localhost:${PORT}`);
  console.log("Database initialized successfully");
});
