frappe.ui.form.on('Event', {
  /**
   * Adds a custom button 'Training Request' for users with 'HOD' role
   * This button creates a new 'Training Request' document.
   */
    refresh: function(frm) {
        if (!frm.is_new() && frappe.user.has_role('HOD')) { // Adds the custom button 'Training Request' in the 'Create' section
            frm.add_custom_button('Training Request', function() {
                // Call the server-side function to fetch the employee ID for the current user
                frappe.call({
                    method: "beams.beams.custom_scripts.employee.employee.get_employee_name_for_user",
                    args: {
                        user_id: frappe.session.user
                    },
                    callback: function(response) {
                        if (response.message) {
                            // If employee ID is found, create a new 'Training Request' document
                            frappe.new_doc('Training Request', {
                                employee: frm.doc.name,
                                training_requested_by: response.message // Set training_requested_by to the fetched employee ID
                            });
                        } else {
                            // Show a message if no employee record is found for the user
                            frappe.msgprint(__('No employee record found for the current user.'));
                        }
                    }
                });
            }, 'Create');
        }
    }
});