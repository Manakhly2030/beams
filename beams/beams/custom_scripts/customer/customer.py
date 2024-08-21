import frappe
from frappe.desk.form.assign_to import add as add_assign
from frappe.utils.user import get_users_with_role

def create_todo_on_customer_creation(doc, method):
    '''
        This function is triggered on the creation of an Customer document.
        It creates a ToDo and assigns it to the Accounts user.
    '''

    users = get_users_with_role("Accounts User")

    if users:
        description = f"New Customer Created: {doc.name}.<br>Please review and update details or take necessary actions."

        add_assign({
            "assign_to": users,
            "doctype": "Customer",
            "name": doc.name,
            "description": description
        })
