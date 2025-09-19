#!/bin/bash
# ===================================================================================
# API Request Automation Script
#
# This script demonstrates the full user and admin authentication flows for the API.
#
# User Flow:
# 1. Registers a new, unique user using an email and password.
# 2. Extracts the `accessToken` from the registration response.
# 3. Logs out the user to invalidate the initial session.
# 4. Logs the user back in using the new credentials.
# 5. Extracts the new `accessToken` and `refreshToken`.
# 6. Uses the `accessToken` to access a protected route (`/users/profile`).
# 7. Creates, reads, updates, and deletes a to-do item.
# 8. Uses the `refreshToken` to get a new set of tokens.
# 9. Logs out again using the latest access token.
#
# Admin Flow:
# 1. Logs in as the admin user (credentials must be set as environment variables).
# 2. Extracts the admin `accessToken`.
# 3. Uses the admin `accessToken` to list all registered users.
# 4. Uses the admin `accessToken` to delete all to-do items.
# 5. Logs out the admin user.
#
# Usage:
#   - Make sure ADMIN_EMAIL and ADMIN_PASSWORD are set in your environment.
#   - Run the script: ./api_requests_curl.sh
#
# Requirements:
#   - `curl`: For making HTTP requests.
#   - `jq`: For parsing JSON responses.
# ===================================================================================

# --- Configuration ---
# API server address
HOSTNAME="http://localhost:3000"

# Generate a unique email for each run to avoid registration conflicts.
UNIQUE_ID=$(date +%s)
EMAIL="testuser-$UNIQUE_ID@example.com"
PASSWORD="a-very-secure-password"
ADMIN_EMAIL="admin@admin.ru"
ADMIN_PASSWORD="admin"

# --- Helper Functions ---

# Prints a formatted header for each section of the script.
print_header() {
  echo ""
  echo "================================================================"
  echo "$1"
  echo "================================================================"
  echo ""
}

# --- Script Execution ---

# #################################################################################
# --- USER FLOW ---
# #################################################################################

# --- 1. Register a new user and capture initial tokens ---

print_header "1. Registering '$EMAIL' and capturing initial tokens"

REGISTRATION_RESPONSE=$(curl -X POST \
  "$HOSTNAME/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'''"$EMAIL"'''",
    "password": "'''"$PASSWORD"'''"
  }' \
  --silent)

if [ -z "$REGISTRATION_RESPONSE" ]; then
    echo "Error: Registration failed. No response from server."
    exit 1
fi

echo "Registration Response:"
echo $REGISTRATION_RESPONSE | jq .

ACCESS_TOKEN_FROM_REGISTRATION=$(echo $REGISTRATION_RESPONSE | jq -r .accessToken)

if [ "$ACCESS_TOKEN_FROM_REGISTRATION" == "null" ] || [ -z "$ACCESS_TOKEN_FROM_REGISTRATION" ]; then
  echo "Error: Failed to retrieve access token from registration response."
  exit 1
fi

echo "Successfully registered '$EMAIL'."


# --- 2. Log out the user to end the initial session ---

print_header "2. Logging out user '$EMAIL' after registration"

curl -X POST \
  "$HOSTNAME/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN_FROM_REGISTRATION" \
  --silent | jq .

echo "User '$EMAIL' has been logged out."


# --- 3. Log in with the newly created user's credentials ---

print_header "3. Logging in as user '$EMAIL'"

LOGIN_RESPONSE=$(curl -X POST \
  "$HOSTNAME/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'''"$EMAIL"'''",
    "password": "'''"$PASSWORD"'''"
  }' \
  --silent)

if [ -z "$LOGIN_RESPONSE" ]; then
    echo "Error: Login failed. No response from server."
    exit 1
fi

echo "Login Response:"
echo $LOGIN_RESPONSE | jq .

ACCESS_TOKEN_FROM_LOGIN=$(echo $LOGIN_RESPONSE | jq -r .accessToken)
REFRESH_TOKEN_FROM_LOGIN=$(echo $LOGIN_RESPONSE | jq -r .refreshToken)

if [ "$ACCESS_TOKEN_FROM_LOGIN" == "null" ] || [ -z "$ACCESS_TOKEN_FROM_LOGIN" ]; then
  echo "Error: Failed to retrieve access token from login response."
  exit 1
fi

echo "Successfully logged in and retrieved new tokens."


# --- 4. Access a protected route using the Access Token from LOGIN ---

print_header "4. Accessing protected profile route (/users/profile)"

curl -X GET \
  "$HOSTNAME/users/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN_FROM_LOGIN" \
  --silent | jq .


# --- 5. To-Do list operations ---

print_header "5. To-Do list operations"

echo "Listing all todos (Should fail without auth):"
curl -X GET "$HOSTNAME/todos" --silent | jq .

echo "\nCreating a new todo (Auth required):"
CREATE_TODO_RESPONSE=$(curl -X POST \
  "$HOSTNAME/todos" \
  -H "Authorization: Bearer $ACCESS_TOKEN_FROM_LOGIN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My new todo"
  }' \
  --silent)

echo $CREATE_TODO_RESPONSE | jq .
TODO_ID=$(echo $CREATE_TODO_RESPONSE | jq -r .id)

if [ "$TODO_ID" == "null" ] || [ -z "$TODO_ID" ]; then
  echo "Error: Failed to create a new todo."
else
  echo "\nGetting todo with ID: $TODO_ID (Should fail without auth):"
  curl -X GET "$HOSTNAME/todos/$TODO_ID" --silent | jq .

  echo "\nUpdating todo with ID: $TODO_ID (Auth required):"
  curl -X PUT \
    "$HOSTNAME/todos/$TODO_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN_FROM_LOGIN" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "My updated todo"
    }' \
    --silent | jq .

  echo "\nDeleting todo with ID: $TODO_ID (Auth required):"
  curl -X DELETE \
    "$HOSTNAME/todos/$TODO_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN_FROM_LOGIN" \
    --silent
  echo "Todo with ID $TODO_ID deleted."
fi


# --- 6. Refresh tokens using the Refresh Token from LOGIN ---

print_header "6. Refreshing tokens for '$EMAIL'"

REFRESH_RESPONSE=$(curl -X POST \
  "$HOSTNAME/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'''"$REFRESH_TOKEN_FROM_LOGIN"'''"
  }' \
  --silent)

echo "Refresh Response:"
echo $REFRESH_RESPONSE | jq .

NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r .accessToken)

if [ "$NEW_ACCESS_TOKEN" == "null" ] || [ -z "$NEW_ACCESS_TOKEN" ]; then
  echo "Error: Failed to refresh tokens."
else
  echo "Successfully refreshed tokens."
fi


# --- 7. Log out the user again ---

print_header "7. Logging out user '$EMAIL' again"

LOGOUT_TOKEN=$ACCESS_TOKEN_FROM_LOGIN
if [ "$NEW_ACCESS_TOKEN" != "null" ] && [ ! -z "$NEW_ACCESS_TOKEN" ]; then
  LOGOUT_TOKEN=$NEW_ACCESS_TOKEN
fi

curl -X POST \
  "$HOSTNAME/auth/logout" \
  -H "Authorization: Bearer $LOGOUT_TOKEN" \
  --silent | jq .

echo "User '$EMAIL' has been logged out."
echo "The refresh token has been invalidated on the server."


# #################################################################################
# --- ADMIN FLOW ---
# #################################################################################

# --- 8. Log in as Admin ---

print_header "8. Logging in as Admin"

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "Skipping Admin Flow: ADMIN_EMAIL or ADMIN_PASSWORD not set in environment."
else
  ADMIN_LOGIN_RESPONSE=$(curl -X POST \
    "$HOSTNAME/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "'''"$ADMIN_EMAIL"'''",
      "password": "'''"$ADMIN_PASSWORD"'''"
    }' \
    --silent)

  echo "Admin Login Response:"
  echo "$ADMIN_LOGIN_RESPONSE" | jq .

  ADMIN_ACCESS_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | jq -r .accessToken)

  if [ "$ADMIN_ACCESS_TOKEN" == "null" ] || [ -z "$ADMIN_ACCESS_TOKEN" ]; then
    echo "Error: Failed to retrieve Admin access token."
  else
    echo "Successfully logged in as Admin."

    # --- 9. Admin Operations ---

    print_header "9. Admin Operations (as Admin)"

    echo "Listing all users (Admin only):"
    curl -X GET \
      "$HOSTNAME/users" \
      -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
      --silent | jq .

    echo "\nDeleting all todos (Admin only):"
    curl -X DELETE \
      "$HOSTNAME/todos/admin/delete-all" \
      -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
      --silent | jq .

    # --- 10. Log out Admin ---

    print_header "10. Logging out Admin"

    curl -X POST \
      "$HOSTNAME/auth/logout" \
      -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
      --silent | jq .

    echo "Admin user has been logged out."
  fi
fi

# --- 11. Get server and database status ---

print_header "11. Get server and database status"

echo "Server Status:"
curl -X GET "$HOSTNAME/" --silent | jq .

echo "\nDatabase Health Check:"
curl -X GET "$HOSTNAME/health" --silent | jq .
