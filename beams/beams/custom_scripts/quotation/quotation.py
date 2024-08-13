import frappe
from frappe.model.mapper import get_mapped_doc

@frappe.whitelist()
def make_sales_invoice(source_name, target_doc=None, ignore_permissions=False):
    """
    Method: Creates a Sales Invoice from a Quotation document.
    Output: A new or updated Sales Invoice document mapped from the Quotation.
    """

    def set_missing_values(source, target):
        target.customer = source.party_name
        target.expected_total = source.rounded_total  # Ensure expected_total is set

        target.run_method("set_missing_values")
        target.run_method("calculate_taxes_and_totals")

    doclist = get_mapped_doc(
        "Quotation",
        source_name,
        {
            "Quotation": {
                "doctype": "Sales Invoice",
                "validation": {"docstatus": ["=", 1]},
                "field_map": {
                    "party_name": "customer",
                    "rounded_total": "expected_total"  # Map total to expected_total
                }
            },
            "Quotation Item": {
                "doctype": "Sales Invoice Item",
                "field_map": {
                    "parent": "quotation",
                    "name": "quotation_item"
                },
            },
            "Sales Taxes and Charges": {
                "doctype": "Sales Taxes and Charges",
                "add_if_empty": True
            },
            "Sales Team": {
                "doctype": "Sales Team",
                "add_if_empty": True
            },
            "Payment Schedule": {
                "doctype": "Payment Schedule",
                "add_if_empty": True
            },
        },
        target_doc,
        set_missing_values,
        ignore_permissions=ignore_permissions,
    )

    # Manually trigger validation
    if doclist:
        doclist.run_method("validate")

    return doclist


@frappe.whitelist()
def make_purchase_invoice(source_name, target_doc=None, ignore_permissions=False):
    '''
    Method: Maps the Quotation ID to the quotation field in Purchase Invoice.
    Output: A new Purchase Invoice document with the Quotation ID mapped to quotation.
    '''

    def set_missing_values(source, target):
        target.quotation = source.name

    doclist = get_mapped_doc(
        "Quotation",
        source_name,
        {
            "Quotation": {
                "doctype": "Purchase Invoice",
                "validation": {"docstatus": ["=", 1]},
                "field_map": {
                    "name": "quotation"
                }
            }
        },
        target_doc,
        set_missing_values,
        ignore_permissions=ignore_permissions,
    )

    return doclist

@frappe.whitelist()
def get_total_sales_invoice_amount(quotation_name):
    '''
    Method: Calculates the total amount of all Sales Invoices linked to the Quotation using rounded_total.
    '''
    total_amount = frappe.db.sql("""
        SELECT SUM(rounded_total) FROM `tabSales Invoice`
        WHERE reference_id = %s AND docstatus = 1
    """, quotation_name)[0][0]

    return total_amount or 0
