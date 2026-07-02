# Factuurnet v1  

Factuurnet v1 is a simple invoicing and administration application I built as an early version of the Factuurnet system. The project is fully functional and is currently being used in a real business environment.

## About the project

This system is designed for basic invoicing and administration tasks. It works as intended, but the codebase is not clean or well-structured, as the focus was mainly on getting a working product rather than building a scalable architecture.

## Status

- Project is **completed**
- Actively used in production by a company
- No further development on v1 (replaced by Factuurnet v2)

## What works

- Invoice creation and management
- Basic administration features
- Database integration
- Fully working production system

## Project structure

The database structure is stored in plain text in:

Factuurnet/database

## How to run the project (Windows only)

This project currently only runs on Windows.

1. Open a terminal in the project folder  
2. Navigate to the backend:

cd Backend

3. Start the server:

node indexserver.js

## Environment configuration

Before running the project, make sure to configure your backend environment variables:

AES_SECRET=

# For company info, use \n for line breaks
COMPANY_INFO=

SMTP_SERVER=
SMTP_PORT=
SSL_STATE=
USER_EMAIL=
USER_PASSWORD=

FROM_EMAIL=

LOGO_PATH="./images/factuur logo.png"
# Path is relative to the Backend folder. If your logo is in Backend/images, use ./images/...

## Important notes

- Backend structure is not well organized
- Database design is simple and not scalable
- No Docker setup included
- This project was built as a learning/real-world prototype

## Factuurnet v2

Factuurnet v2 is a complete rewrite of this system, focusing on:

- Cleaner architecture
- Better backend structure
- Improved database design
- Docker support
- More maintainable and scalable codebase

## Repository note

For personal reasons, the original repository (including full commit history) has been removed and replaced with this version. 
---

This project represents an early stage of my development journey and shows how my approach to software development has evolved over time.