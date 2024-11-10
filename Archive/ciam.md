
---

## Configuration and Integration of CIAM in .NET Core Web Project

### Introduction

This document provides a brief explanation of how Customer Identity and Access Management (CIAM) is configured and integrated into our .NET Core web project, which acts as a Backend-for-Frontend (BFF) for a React application, using OpenID Connect (OIDC). It details the setup in the `Startup` class, the use of environment variables for storing sensitive information such as the CIAM domain and secrets, the implementation of a session validator middleware for CIAM session validation, and the logout process handled by the `DefaultLogoutService`.

### Configuration Overview

CIAM is configured in the `Startup` class of the .NET Core application. The key components involved in this configuration include the registration of the OpenID Connect middleware, setting up the authentication services, utilizing environment variables for secure handling of CIAM credentials, implementing a custom middleware for session validation, and managing logout processes.

### Step-by-Step Configuration

#### Environment Variables Setup
   
Sensitive information such as the CIAM domain, client ID, and client secret are stored in environment variables. This ensures that these credentials are not hard-coded in the application code, enhancing security.

Common environment variables used might include:
- `CIAM_DOMAIN`
- `CIAM_CLIENT_ID`
- `CIAM_CLIENT_SECRET`

#### Configuring the Startup Class

The `Startup` class is where the application services and middleware are configured. Key sections within the `Startup` class related to CIAM configuration include:

- **Services Configuration**: This is where authentication services are added and configured. Authentication is set up with cookies for session management and OpenID Connect (OIDC) for handling CIAM.
- **OIDC Configuration**: This involves setting the authority (CIAM domain), client ID, client secret, response type, token saving, and claims retrieval. Token validation parameters are also specified to define the claim types for user identity and roles.
- **Session Validator Middleware**: A custom middleware is added to validate the CIAM session for each request, ensuring the session's validity and taking necessary actions if the session is invalid.
- **Logout Service**: The `DefaultLogoutService` handles logout requests, managing self-initiated logouts, session expirations, and inactive sessions.

#### Authentication Middleware Registration
   
The authentication services are registered with the application, specifying cookies for session management and OpenID Connect (OIDC) for handling CIAM. This setup involves configuring the authentication scheme and handling tokens securely.

#### OIDC Configuration
   
The OpenID Connect middleware is configured with the necessary parameters, including:
- **Authority**: The URL of the CIAM domain.
- **ClientId** and **ClientSecret**: Credentials for authenticating the application with CIAM.
- **ResponseType**: Specifies the type of response expected from the CIAM provider, typically "code" for authorization code flow.
- **SaveTokens**: Ensures tokens are saved in the authentication cookie for subsequent use.
- **GetClaimsFromUserInfoEndpoint**: Indicates that user claims should be retrieved from the UserInfo endpoint.

#### Token Validation Parameters

Token validation parameters are configured to specify the claim types for user identity and roles, ensuring that the tokens received from the CIAM provider are correctly validated.

#### Session Validator Middleware

A custom middleware is implemented to validate the CIAM session for each request. This middleware checks if the session is still active and performs necessary actions if the session is invalid, such as redirecting the user to the login page. The middleware is registered in the application pipeline to be executed with each request.

#### Backend-for-Frontend (BFF) Role

As a BFF, the .NET Core web project serves as an intermediary between the React frontend and backend services. It handles authentication and session management, providing a secure and streamlined communication channel for the React application. This architecture centralizes CIAM integration in the BFF layer, simplifying the frontend code and enhancing security.

- **Proxying Requests**: The BFF handles API requests from the React frontend, attaching necessary authentication tokens and validating sessions before forwarding requests to backend services.
- **Session Management**: The BFF manages user sessions, ensuring that session validation and renewal are handled transparently for the React frontend.
- **Security**: By centralizing authentication and session management in the BFF, sensitive operations and credentials are kept secure and isolated from the frontend code.

#### Logout Management

The `DefaultLogoutService` handles the logout functionality, managing different types of logout scenarios:
- **Self-Initiated Logout**: When a user actively logs out from the application, the service ensures that the session is terminated correctly and the user is redirected to the appropriate logout page.
- **Session Logout**: The service manages session expirations, ensuring that expired sessions are logged out and the user is notified or redirected accordingly.
- **Inactive Logout**: The service handles cases where the user session becomes inactive for a specified period, automatically logging out the user and ensuring security.

### Conclusion

This document has provided a concise overview of how CIAM is configured in a .NET Core web project using environment variables and the OpenID Connect (OIDC) middleware, along with the implementation of a custom session validator middleware. Additionally, it outlines the role of the .NET Core project as a Backend-for-Frontend (BFF) for a React application, centralizing and securing CIAM integration and session management. The document also details the management of logout processes through the `DefaultLogoutService`, ensuring secure handling of self-initiated, session, and inactive logouts. By following the described setup, the project ensures secure and efficient management of external user authentication, session validation, and logout processes.

---
