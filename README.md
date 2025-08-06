# 🍽️ Food Ordering and Delivery System

🚀 **Status: Ready for Azure deployment!**

This is a **microservices-based food ordering and delivery system** designed to provide a scalable, modular, and secure platform for ordering meals, managing restaurants, handling payments, and tracking deliveries in real time.

<div align="center">
  <img src="https://img.shields.io/badge/SpringBoot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" />
  <img src="https://img.shields.io/badge/Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Eureka-0078D7?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</div>



## 📌 Project Overview

The system simulates a real-world food ordering platform like Uber Eats or DoorDash, supporting multiple user roles including customers, restaurants, delivery partners, and administrators.

Each functionality is encapsulated in independent services to ensure maintainability and scalability using Spring Boot, Angular, Kafka, and JWT-based authentication.


##  Features

###  **Customer Features**
```
- Restaurant discovery with location-based filtering 
- Menu browsing with images and descriptions
- Shopping cart with quantity management
- Secure checkout with Stripe payment processing
- Real-time order tracking via WebSocket
- Live GPS tracking of delivery drivers
- Multiple delivery addresses management
- Complete order history with reorder functionality
```
###  **Restaurant Admin Features**
```
- Restaurant profile management
- Menu management with image uploads
- Order management and status updates
- Azure Storage integration for cloud file management
- Sales analytics and reporting
- Real-time order notifications
```
###  **Delivery Driver Features**
```
- Automatic delivery assignment system
- Real-time GPS location updates
- Delivery status management
- Complete delivery history and statistics
```
###  **System Admin Features**
```
- Comprehensive user management
- Role-based access control
- System monitoring and health checks
- Platform-wide analytics and insights
```

##  Key Functionalities by Service

###  **User Service**
- Handles user registration, login, and profile management.
- Secure authentication using Spring Security and JWT.
- Role-based access control (`CUSTOMER`, `RESTAURANT`, `DELIVERY`, `ADMIN`).
- Endpoints to fetch user roles and details.

###  **Restaurant Service**
- Allows restaurant owners to:
  - Add, update, or delete restaurants.
  - Upload and manage restaurant profile images.
  - Manage menu items (CRUD).
- Uses Azure Blob Storage for image handling.
- Ensures authorization for modifying content.

###  **Order Service**
- Enables customers to:
  - Place orders based on selected restaurant and food items.
  - View order history.
- Enables restaurants and delivery agents to:
  - Accept/reject orders.
  - Update order status (`Pending`, `Preparing`, `Out for Delivery`, `Delivered`).
- Publishes order events to Kafka.

###  **Payment Service**
- Integrates with **Stripe API** for secure payment processing.
- Confirms payment success and emits events to Kafka.

###  **Delivery Service**
- Assigns delivery partners to active orders.
- Delivery agents can:
  - Accept assignments.
  - Update delivery status (`Picked`, `In Transit`, `Delivered`).
- Listens to Kafka order events.

###  **Notification Service**
- Listens to Kafka events from orders, payments, and deliveries.
- Sends email notifications for:
  - Order confirmation and status changes.
  - Payment confirmations.
  - Delivery progress.
- Uses Spring Mail for async mail delivery.

###  **API Gateway**
- Central gateway using Spring Cloud Gateway.
- Handles routing, JWT validation, and CORS configuration.

###  **Service Discovery**
- Uses Eureka for registering and discovering services by name.
- Enables scalable microservice interaction.



##  Technologies Used

- **Backend**: Spring Boot, Spring Cloud, Spring Security, Kafka, Stripe, Mail, Eureka
- **Frontend**: Angular
- **Authentication**: JWT
- **Storage**: Azure Blob Storage
- **Messaging**: Apache Kafka
- **Database**: PostgreSQL (per service)
- **Service Discovery:** Netflix Eureka
- **Payment Processing:** Stripe Java SDK
- **Documentation:** OpenAPI/Swagger
- **Containerization:** Docker + Kubernetes

## 📁 Project Structure

```

food-ordering-system/
├── backend/                          # Backend microservices
│   ├── api-gateway/                  # API Gateway service (Port 8080)
│   │   ├── src/main/java/com/foodordering/apigateway/
│   │   │   ├── config/              # Security, CORS, Swagger configs
│   │   │   ├── filter/              # JWT and header filters
│   │   │   └── util/                # JWT utilities
│   │   └── Dockerfile
│   ├── user-service/                # User management service (Port 8081)
│   │   ├── src/main/java/com/foodordering/userservice/
│   │   │   ├── config/              # Security, JWT, Azure configs
│   │   │   ├── controller/          # REST controllers
│   │   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── entity/              # JPA entities
│   │   │   ├── repository/          # Data repositories
│   │   │   ├── service/             # Business logic
│   │   │   └── util/                # Utilities
│   │   └── Dockerfile
│   ├── restaurant-service/          # Restaurant management (Port 8082)
│   ├── order-service/               # Order processing (Port 8083)
│   ├── payment-service/             # Payment processing (Port 8084)
│   ├── delivery-service/            # Delivery management (Port 8085)
│   ├── notification-service/        # Real-time notifications (Port 8086)
│   └── service-registry/            # Eureka service registry (Port 8761)
├── frontend/                        # Angular frontend application
│   ├── src/app/
│   │   ├── core/                    # Core functionality
│   │   │   ├── guards/              # Route guards
│   │   │   ├── interceptors/        # HTTP interceptors
│   │   │   ├── models/              # TypeScript interfaces
│   │   │   └── services/            # Angular services
│   │   ├── features/                # Feature modules
│   │   │   ├── admin/               # Admin dashboard
│   │   │   ├── auth/                # Authentication
│   │   │   ├── delivery-driver/     # Driver interface
│   │   │   ├── order/               # Order management
│   │   │   ├── restaurant/          # Restaurant features
│   │   │   ├── restaurant-admin/    # Restaurant admin panel
│   │   │   └── user/                # User profile
│   │   └── shared/                  # Shared components
│   ├── nginx/                       # Nginx configuration
│   └── Dockerfile
├── kubernetes/                      # Kubernetes deployment configs
│   ├── api-gateway/
│   ├── user-service/
│   ├── restaurant-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── delivery-service/
│   ├── notification-service/
│   ├── postgres/
│   └── frontend/
├── docker-compose.yml               # Docker Compose setup
├── init-db.sql                      # Database initialization
└── README.md                        # This file

```

##  Setup Instructions

### ✅ Prerequisites
- Java 17+
- Node.js & Angular CLI
- PostgreSQL
- Kafka & Zookeeper
- Docker (optional)
- Stripe API keys
- Azure Blob Storage credentials



### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/food-ordering-system.git
cd food-ordering-system
```

### **2. Database Setup**
```bash
# Create databases for each service
createdb user_service_db
createdb food_delivery_restaurant_db
createdb order-service-DB
createdb payment_service_db
createdb delivery_service_db
createdb notification_service_db

# Run initialization script
psql -d user_service_db -f init-db.sql
```

### **3. Start Infrastructure Services**
```bash
# Start Kafka, Zookeeper using Docker Compose
docker-compose up -d kafka zookeeper postgres
```

### **4. Backend Services Setup**

#### **Start Service Registry (Required First)**
```bash
cd backend/service-registry
./mvnw spring-boot:run
```

#### **Start All Microservices**
```bash
# Terminal 1: API Gateway
cd backend/api-gateway
./mvnw spring-boot:run

# Terminal 2: User Service
cd backend/user-service  
./mvnw spring-boot:run

# Terminal 3: Restaurant Service
cd backend/restaurant-service
./mvnw spring-boot:run

# Terminal 4: Order Service
cd backend/order-service
./mvnw spring-boot:run

# Terminal 5: Payment Service
cd backend/payment-service
./mvnw spring-boot:run

# Terminal 6: Delivery Service
cd backend/delivery-service
./mvnw spring-boot:run

# Terminal 7: Notification Service
cd backend/notification-service
./mvnw spring-boot:run
```

### **5. Frontend Setup**
```bash
cd frontend
npm install
ng serve
```

### **6. Access the Application**
- **Frontend:** http://localhost:4200
- **API Gateway:** http://localhost:8080
- **Swagger UI:** http://localhost:8080/swagger-ui.html

## 📖 Documentation

For detailed documentation including API specifications, deployment guides, and development workflows, visit our **[GitHub Wiki](https://github.com/dilrukshax/food-delivery-system/wiki)**.

### **Quick Links:**
- **[API Documentation](../../wiki/API-Documentation)** - Complete API reference with examples
- **[Setup Guide](../../wiki/Setup-Guide)** - Detailed setup and configuration instructions
- **[Architecture Guide](../../wiki/Architecture-Guide)** - System architecture and design decisions
- **[Deployment Guide](../../wiki/Deployment-Guide)** - Production deployment strategies
- **[Contributing Guide](../../wiki/Contributing-Guide)** - How to contribute to the project
- **[Troubleshooting](../../wiki/Troubleshooting)** - Common issues and solutions

## 🔧 Configuration

### **Environment Variables**

#### **Database Configuration**
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/{service}_db
spring.datasource.username=postgres
spring.datasource.password=your_password
```

#### **JWT Configuration**
```properties
jwt.secret=your-256-bit-secret-key
jwt.expiration=86400000
jwt.refresh-expiration=604800000
```

#### **Stripe Configuration**
```properties
stripe.api.key=sk_test_your_stripe_secret_key
```

#### **Azure Storage Configuration**
```properties
azure.storage.connection-string=your-azure-connection-string
azure.storage.container-name=your-container-name
```

## 🚀 Deployment

### **Docker Deployment**
```bash
# Build and run all services
docker-compose up -d
```

### **Kubernetes Deployment**
```bash
# Deploy infrastructure
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secrets.yaml

# Deploy all services
kubectl apply -f kubernetes/
```

##  Application UI
![Home Page](images/UI.png)

##  Contributing

We welcome contributions! To get started:

1. Fork the repo
2. Create a new branch:

   ```bash
   git checkout -b feature/my-feature
   ```
3. Commit your changes:

   ```bash
   git commit -m "Add my feature"
   ```
4. Push to your fork:

   ```bash
   git push origin feature/my-feature
   ```
5. Open a Pull Request


## 📬 Contact

* **Author**: Dilan Dilruksha
* **Email**: [dilandilruksha0@gmail.com](mailto:dilandilruksha0@gmail.com)




