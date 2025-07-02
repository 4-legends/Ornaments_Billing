# Ornaments Billing System

A comprehensive billing and inventory management system specifically designed for ornaments and jewelry businesses. This web application provides a complete solution for managing products, customers, invoices, and generating detailed reports.

## Features

### 🏠 Dashboard

- **Real-time Statistics**: View total products, customers, invoices, and revenue at a glance
- **Recent Sales**: Monitor latest transactions and customer activity
- **Low Stock Alerts**: Get notified when product inventory is running low
- **Visual Analytics**: Clean, modern interface with intuitive data presentation

### 📦 Product Management

- **Add/Edit Products**: Complete product catalog management
- **Ornament-Specific Fields**:
  - Weight (in grams)
  - Purity (24K, 22K, 18K, 14K, 925 Silver, etc.)
  - Category (Gold, Silver, Platinum, Diamond, Pearl, etc.)
  - Price and stock quantity
- **Stock Tracking**: Automatic inventory updates when sales are made
- **Bulk Operations**: Efficient management of large product catalogs

### 👥 Customer Management

- **Customer Database**: Store complete customer information
- **GST Integration**: Support for GST number tracking
- **Contact Details**: Email, phone, and address management
- **Customer History**: Track all transactions per customer

### 🧾 Invoice Generation

- **Professional Invoices**: Create detailed, professional-looking invoices
- **Multiple Items**: Add multiple products to a single invoice
- **Tax Calculation**: Automatic GST calculation (default 18%)
- **Discount Support**: Apply percentage-based discounts
- **Unique Invoice Numbers**: Auto-generated sequential invoice numbers
- **Payment Status Management**:
  - Track invoice status (Pending, Paid, Cancelled, Overdue)
  - Update invoice status in real-time
  - View detailed invoice information with status change capability
  - Professional invoice view modal with complete details
- **PDF Generation**:
  - Generate professional PDF invoices
  - Download invoices as PDF files
  - Complete invoice details with company branding
  - Professional layout with all invoice items and totals

### 📊 Reports & Analytics

- **Sales Reports**: Generate date-range based sales reports
- **Inventory Reports**: Complete stock analysis with sold quantities
- **Revenue Tracking**: Monitor business performance over time
- **Export Capabilities**: Easy data export for external analysis

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite (lightweight, file-based)
- **Frontend**: Vanilla JavaScript with modern CSS
- **UI Framework**: Custom responsive design with Font Awesome icons
- **Styling**: CSS Grid, Flexbox, and modern design principles
- **PDF Generation**: PDFKit for professional invoice PDFs
- **Containerization**: Docker with Docker Compose

## Quick Start with Docker 🐳

### Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

### Option 1: Using the Deployment Script (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Ornaments_Billing
   ```

2. **Deploy with Docker**

   ```bash
   # For production deployment
   ./deploy.sh production

   # For development deployment (with hot reloading)
   ./deploy.sh development
   ```

3. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

### Option 2: Using Docker Compose Directly

1. **Production Deployment**

   ```bash
   # Build and start the application
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop the application
   docker-compose down
   ```

2. **Development Deployment (with hot reloading)**

   ```bash
   # Build and start in development mode
   docker-compose -f docker-compose.dev.yml up -d

   # View development logs
   docker-compose -f docker-compose.dev.yml logs -f
   ```

### Option 3: Using Docker Commands

1. **Build the Docker image**

   ```bash
   docker build -t ornaments-billing .
   ```

2. **Run the container**

   ```bash
   docker run -p 3000:3000 -v ornaments_data:/app ornaments-billing
   ```

## Docker Management Commands

### Using the Deployment Script

```bash
# Production deployment
./deploy.sh production

# Development deployment
./deploy.sh development

# View production logs
./deploy.sh logs

# View development logs
./deploy.sh dev-logs

# Stop all containers
./deploy.sh stop

# Clean up Docker resources
./deploy.sh cleanup

# Show help
./deploy.sh help
```

### Using Docker Compose

```bash
# Start production
docker-compose up -d

# Start development
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

### Using npm scripts

```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run

# Start with Docker Compose
npm run docker:compose

# Start development with Docker Compose
npm run docker:compose:dev

# Stop containers
npm run docker:stop

# View logs
npm run docker:logs
```

## Traditional Installation (Without Docker)

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Ornaments_Billing
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the application**

   ```bash
   npm start
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

### Development Mode

For development with auto-restart on file changes:

```bash
npm run dev
```

## Database Schema

The application uses SQLite with the following tables:

### Products Table

- `id` (Primary Key)
- `name` (Product name)
- `description` (Product description)
- `category` (Gold, Silver, etc.)
- `weight` (in grams)
- `purity` (24K, 22K, etc.)
- `price` (Product price)
- `stock_quantity` (Available stock)
- `created_at`, `updated_at` (Timestamps)

### Customers Table

- `id` (Primary Key)
- `name` (Customer name)
- `email` (Email address)
- `phone` (Phone number)
- `address` (Customer address)
- `gst_number` (GST registration number)
- `created_at` (Timestamp)

### Invoices Table

- `id` (Primary Key)
- `invoice_number` (Unique invoice number)
- `customer_id` (Foreign key to customers)
- `total_amount` (Subtotal)
- `tax_amount` (GST amount)
- `discount_amount` (Discount applied)
- `final_amount` (Total after tax and discount)
- `payment_status` (pending/paid)
- `invoice_date`, `due_date` (Timestamps)
- `notes` (Additional notes)

### Invoice Items Table

- `id` (Primary Key)
- `invoice_id` (Foreign key to invoices)
- `product_id` (Foreign key to products)
- `quantity` (Quantity sold)
- `unit_price` (Price per unit)
- `total_price` (Total for this item)

### Sales Table

- `id` (Primary Key)
- `invoice_id` (Foreign key to invoices)
- `product_id` (Foreign key to products)
- `quantity` (Quantity sold)
- `unit_price` (Price per unit)
- `total_price` (Total for this sale)
- `sale_date` (Timestamp)

## API Endpoints

### Products

- `GET /api/products` - Get all products
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Customers

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add new customer

### Invoices

- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get specific invoice details

### Reports

- `GET /api/reports/sales` - Get sales report (with optional date filters)
- `GET /api/reports/inventory` - Get inventory report

## Usage Guide

### Adding Products

1. Navigate to "Product Management"
2. Click "Add Product"
3. Fill in product details:
   - Name and description
   - Category (Gold, Silver, etc.)
   - Weight in grams
   - Purity (24K, 22K, etc.)
   - Price and initial stock quantity
4. Click "Save Product"

### Creating Invoices

1. Navigate to "Invoice Management"
2. Click "Create Invoice"
3. Select a customer from the dropdown
4. Add products to the invoice:
   - Select product from dropdown
   - Enter quantity
   - Unit price auto-fills
   - Total calculates automatically
5. Adjust tax and discount percentages if needed
6. Add any notes
7. Click "Create Invoice"

### Generating Reports

1. Navigate to "Reports & Analytics"
2. For Sales Report:
   - Select start and end dates
   - Click "Generate"
3. For Inventory Report:
   - Click "Generate" to see current stock levels

## Customization

### Adding New Product Categories

Edit the product form in `public/index.html`:

```html
<select id="product-category">
  <option value="Gold">Gold</option>
  <option value="Silver">Silver</option>
  <!-- Add your custom categories here -->
</select>
```

### Modifying Tax Rates

The default GST rate is 18%. To change this:

1. Edit the default value in `public/index.html` (line with `invoice-tax`)
2. Update the calculation logic in `public/script.js` if needed

### Styling Customization

The application uses CSS custom properties and modern styling. Main styles are in `public/styles.css`.

## Docker Configuration

### Production Configuration

- Uses `Dockerfile` for optimized production build
- Runs with `docker-compose.yml`
- Includes health checks and restart policies
- Database persistence with Docker volumes

### Development Configuration

- Uses `Dockerfile.dev` for development environment
- Runs with `docker-compose.dev.yml`
- Includes hot reloading with nodemon
- Source code mounted for live editing

### Environment Variables

- `NODE_ENV`: Set to `production` or `development`
- `PORT`: Application port (default: 3000)

## Security Features

- **Input Validation**: All user inputs are validated
- **SQL Injection Protection**: Parameterized queries prevent SQL injection
- **XSS Protection**: Output encoding prevents cross-site scripting
- **CORS Configuration**: Proper CORS setup for API security
- **Non-root User**: Docker containers run as non-root user for security

## Performance Optimizations

- **Database Indexing**: Proper indexing on frequently queried fields
- **Efficient Queries**: Optimized SQL queries with proper joins
- **Frontend Caching**: Client-side caching of frequently accessed data
- **Responsive Design**: Mobile-friendly interface for all devices
- **Docker Optimization**: Multi-stage builds and Alpine Linux for smaller images

## Troubleshooting

### Docker Issues

1. **Port already in use**

   ```bash
   # Check what's using port 3000
   lsof -i :3000

   # Stop existing containers
   ./deploy.sh stop
   ```

2. **Docker build fails**

   ```bash
   # Clean up Docker cache
   docker system prune -a

   # Rebuild without cache
   docker-compose build --no-cache
   ```

3. **Container won't start**

   ```bash
   # Check container logs
   docker-compose logs

   # Check container status
   docker-compose ps
   ```

### Common Issues

1. **Database errors**

   ```bash
   # Remove Docker volume to reset database
   docker-compose down -v
   docker-compose up -d
   ```

2. **Module not found errors**

   ```bash
   # Rebuild Docker image
   docker-compose build --no-cache
   ```

3. **Permission issues**

   ```bash
   # Fix file permissions
   chmod +x deploy.sh
   ```

### Logs

Check the console output for detailed error messages and debugging information:

```bash
# Production logs
./deploy.sh logs

# Development logs
./deploy.sh dev-logs
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## Future Enhancements

- PDF invoice generation
- Email integration for invoice delivery
- Barcode scanning for products
- Multi-currency support
- Advanced analytics and charts
- User authentication and roles
- Backup and restore functionality
- Mobile app development
- Kubernetes deployment support
- CI/CD pipeline integration

---

**Built with ❤️ for the ornaments and jewelry business community**
