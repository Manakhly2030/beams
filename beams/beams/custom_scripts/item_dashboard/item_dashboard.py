from frappe import _


def get_data(data=None):
	return {
		"heatmap": True,
		"heatmap_message": _("This is based on stock movement. See {0} for details").format(
			'<a href="/app/query-report/Stock Ledger">' + _("Stock Ledger") + "</a>"
		),
		"fieldname": "item_code",
		"non_standard_fieldnames": {
			"Work Order": "production_item",
			"Product Bundle": "new_item_code",
			"BOM": "item",
			"Batch": "item",
		},
		"transactions": [
			{"label": _("Groups"), "items": ["Item Alternative"]},
			{"label": _("Pricing"), "items": ["Item Price", "Pricing Rule"]},
			{"label": _("Sell"), "items": ["Quotation", "Sales Order", "Sales Invoice"]},
			{
				"label": _("Buy"),
				"items": [
					"Material Request",
					"Supplier Quotation",
					"Request for Quotation",
					"Purchase Order",
					"Purchase Receipt",
					"Purchase Invoice",
				],
			},
			{"label": _("Traceability"), "items": ["Serial No", "Batch"]},
			{"label": _("Stock Movement"), "items": ["Stock Entry", "Stock Reconciliation"]},
		],
	}
