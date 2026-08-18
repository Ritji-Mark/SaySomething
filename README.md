# SaySomething

SaySomething is a civic reporting platform that allows citizens to report public issues and anomalies to the appropriate authorities.

The platform is designed to make civic reporting easier, more transparent, and trackable by connecting citizens with the authorities responsible for addressing reported issues.

## Purpose

SaySomething allows citizens to:

* Report public issues and anomalies
* Provide descriptions and supporting evidence
* Share the location of an issue
* Track the progress of submitted reports
* Receive updates about their reports

Authorities can receive, review, assign, manage, and resolve reports submitted by citizens.

---

## User Roles

### Citizen

Citizens can:

* Create an account
* Log in and manage their profile
* Submit civic reports
* Select a report category
* Provide descriptions and evidence
* Provide the location of an issue
* View submitted reports
* Track report status
* Receive report updates

### Authority

Authorities can:

* Log in to the platform
* View reports assigned to them
* Review submitted reports
* Accept and manage reports
* Update report status
* Add comments
* Provide resolution information
* Mark reports as resolved

### Administrator

Administrators manage the overall platform.

They can:

* Manage users
* Manage authorities
* Manage report categories
* View all reports
* Assign reports to appropriate authorities
* Monitor platform activity
* Manage problematic or false reports
* Manage system settings

---

## Report Categories

SaySomething currently supports five report categories:

1. Roads
2. Electricity
3. Water
4. Environment
5. Public Safety

The category system will be designed to remain configurable so that additional categories can be introduced in the future.

---

## Report Lifecycle

Reports follow a defined lifecycle:

```text
Submitted
    ↓
Under Review
    ↓
Assigned
    ↓
In Progress
    ↓
Resolved
```

Additional statuses such as `Rejected`, `Duplicate`, and `Closed` may be introduced in future versions.

---

## System Architecture

SaySomething uses a JavaScript-based full-stack architecture.

```text
                    SaySomething
                         │
             ┌───────────┴───────────┐
             ↓                       ↓
         Frontend                 Backend
          React                  Node.js
       JavaScript              Express.js
                                    │
                                    ↓
                              PostgreSQL
                               + PostGIS
```

### Frontend

#### React + JavaScript

Responsible for:

* Citizen interface
* Authority dashboard
* Administrator dashboard
* Authentication interfaces
* Report submission
* Report tracking
* Maps and location interfaces

### Backend

**Node.js + Express.js**

Responsible for:

* REST API
* Authentication
* Authorization
* User management
* Report management
* Authority assignment
* Report status management
* Notifications
* Communication with the database

### Database

**PostgreSQL + PostGIS**

PostgreSQL stores application data while PostGIS provides geographic functionality for storing and querying report locations.

---

## Technology Stack

| Technology | Purpose                        |
| ---------- | ------------------------------ |
| JavaScript | Primary programming language   |
| React      | Frontend framework             |
| Node.js    | Backend runtime                |
| Express.js | Backend framework              |
| PostgreSQL | Relational database            |
| PostGIS    | Geospatial data                |
| Git        | Version control                |
| GitHub     | Source code repository         |
| REST API   | Frontend/backend communication |

---

## Project Structure

The project will follow this general structure:

```text
SaySomething/
│
├── frontend/
│   ├── src/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── config/
│   │
│   ├── server.js
│   └── package.json
│
├── database/
│
├── docs/
│
├── .gitignore
├── README.md
└── package.json
```

The structure may evolve as development progresses.

---

## Development Phases

### Phase 1 — Planning & Foundation

* Define requirements
* Define user roles
* Define report categories
* Design system architecture
* Design database
* Set up development environment
* Initialize Git repository

### Phase 2 — Authentication & User Management

* Citizen registration/login
* Authority authentication
* Administrator authentication
* Role-based access control
* User profiles

### Phase 3 — Civic Reporting

* Create reports
* Select categories
* Add descriptions
* Upload evidence
* Capture locations
* Generate report IDs
* View and track reports

### Phase 4 — Authority & Administrator Management

* Authority dashboard
* Report assignment
* Report review
* Status management
* Resolution management
* Administrator dashboard

### Phase 5 — Advanced Features

* Interactive maps
* Geospatial searches
* Notifications
* Duplicate report detection
* Analytics
* AI-assisted report classification

### Phase 6 — Testing & Deployment

* Functional testing
* Security testing
* API testing
* Performance testing
* Database optimization
* Deployment
* Monitoring and maintenance

---

## Current Development Status

**Phase 1 — Planning & Foundation**

Status: In Progress

### Completed

* [x] Project name defined
* [x] Purpose defined
* [x] User roles defined
* [x] Report categories defined
* [x] Report lifecycle defined
* [x] Technology stack selected
* [x] Initial project structure created
* [x] Git repository initialized

### Next

* [ ] Finalize database schema
* [ ] Set up Node.js backend
* [ ] Set up Express.js
* [ ] Design REST API
* [ ] Set up React frontend
* [ ] Configure PostgreSQL/PostGIS
* [ ] Create initial system documentation

---

## 📄 License

This project is currently under development.

License details will be added before the first public release.
