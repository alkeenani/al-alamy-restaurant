# Al Alamy Restaurant 🍽️

A modern, responsive restaurant menu and online ordering platform built to help customers explore the menu, customize their orders, and contact the restaurant directly through WhatsApp.

The platform also includes a secure admin dashboard that allows restaurant staff to manage menu categories, products, prices, availability, and product options without editing the source code.

🔗 **Live Demo:** https://al-alamy-restaurant.vercel.app/

---

## 📸 Project Overview

Al Alamy Restaurant is a real-world restaurant web application designed to provide a smooth ordering experience for customers and an easy-to-use management system for restaurant staff.

The application supports Arabic RTL layouts, dynamic menu data, product customization, a shopping cart, and WhatsApp checkout.

---

## ✨ Features

### 🛍️ Customer Experience

- Browse menu categories and available products.
- View product names, descriptions, and prices.
- Customize products using available options and sizes.
- Automatically calculate prices based on selected options.
- Add products to the shopping cart.
- Update quantities and review order totals.
- Enter customer information, including name, phone number, and delivery address.
- Add order notes and an optional additional phone number.
- Generate a formatted order message and continue checkout through WhatsApp.
- Contact the restaurant about services with prices determined by quantity.

### ⚙️ Admin Dashboard

- Secure admin authentication.
- Protected admin routes.
- Dashboard overview and statistics.
- Create, edit, and delete menu categories.
- Create, edit, and delete products.
- Update product prices and descriptions.
- Control product availability.
- Manage product option groups and values.
- Support configurable product combinations and pricing.
- Manage menu content without modifying application code.
- Responsive dashboard for desktop, tablet, and mobile devices.

### 📱 Responsive Design

- Fully responsive customer interface.
- Responsive admin dashboard.
- Arabic Right-to-Left (RTL) support.
- Mobile-friendly navigation and layouts.
- Optimized forms, product cards, and modals.

---

## 🛠️ Tech Stack

| Technology             | Purpose                           |
| ---------------------- | --------------------------------- |
| React                  | Building the user interface       |
| JavaScript             | Application logic                 |
| Vite                   | Development server and build tool |
| CSS3                   | Styling and responsive layouts    |
| Supabase               | Database and authentication       |
| PostgreSQL             | Menu data storage                 |
| React Router           | Application routing               |
| WhatsApp Click to Chat | Order communication               |
| Vercel                 | Deployment and hosting            |
| Git & GitHub           | Version control                   |

---

## 🗄️ Database

The application uses Supabase with PostgreSQL to store and manage menu data.

Main database tables:

- `categories` — Menu categories.
- `products` — Product information and pricing.
- `product_option_groups` — Product customization groups.
- `product_option_values` — Available customization options.
- `product_option_combinations` — Configured combination prices.
- `product_option_combination_values` — Relationships between combinations and option values.
- `admin_users` — Authorized dashboard users.

### Security

- Row Level Security (RLS) is enabled on the relevant database tables.
- Public users can read active menu data.
- Authorized administrators can manage menu content.
- Admin dashboard routes are protected by authentication and admin authorization checks.

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/alkeenani/al-alamy-restaurant.git
```

### 2. Navigate to the Project Directory

```bash
cd al-alamy-restaurant
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the placeholder values with your own Supabase project credentials.

**Important:** Never commit your actual `.env` file or expose private credentials.

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at the local URL shown in your terminal, usually:

```text
http://localhost:5173
```

---

## 📦 Available Scripts

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start the development server     |
| `npm run build`   | Build the production application |
| `npm run preview` | Preview the production build     |
| `npm run lint`    | Run ESLint checks                |

---

## 🌐 Deployment

The project is deployed using **Vercel**.

Production URL:

https://al-alamy-restaurant.vercel.app/

To deploy your own instance:

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables.
4. Deploy the application.

Make sure your Supabase project, database schema, authentication settings, and security policies are configured before using the application.

---

## 👨‍💻 Developer

**Mohamed Alkenani**

Front-End Developer interested in building responsive, user-friendly web applications.

- GitHub: [@alkeenani](https://github.com/alkeenani)
- Portfolio: [My Portfolio](https://my-portfolio-ten-lime-21.vercel.app/)
- Facebook: [Mohamed Alkenani](https://www.facebook.com/mohamedalkenani2006/)

---

## 📄 License

This project was developed for Al Alamy Restaurant.

All rights reserved unless otherwise specified.
