// Copyright (c) 2025, efeone and contributors
// For license information, please see license.txt

frappe.ui.form.on("Award Expense Detail", {
    amount: function (frm) {
        frm.call("update_total_amount");
    }
});
