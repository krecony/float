# Product plan

Implementation status and code mapping: [ARCHITECTURE.md](ARCHITECTURE.md).

# Server

- Database
    - Tables
        - group
            - people (many to many)
            - transactions (one to many)
            - virtual card (one per group)
        - person
            - card info
            - legal shit?
                - name
                - birth
                - id
        - transaction
            - amount
            - group
            - people (subset of group)
- API
    - adding user
    - adding group
    - adding user to group
    - adding transaction

# Client

- Creating account
- Verifying ID
- Creating group
- Joining group
- Spending money
- Notification to accept transaction
- Group view with all transactions
- View group virtual card

# Website

- Landing page
    - maybe 3d phones touching (cool)
- Download button
- Link to source code

