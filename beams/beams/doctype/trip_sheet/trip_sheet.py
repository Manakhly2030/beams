# Copyright (c) 2025, efeone and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document
from frappe.utils import get_datetime
from frappe import _  # Import _ for translation and localization

class TripSheet(Document):
    def validate(self):
        self.validate_start_datetime_and_end_datetime()
        self.calculate_and_validate_fuel_data()

    @frappe.whitelist()
    def validate_start_datetime_and_end_datetime(self):
        """
        Validates that starting_datetime and ending_datetime are properly set and checks
        if starting_datetime is not later than ending_datetime.
        """
        if not self.starting_date_and_time or not self.ending_date_and_time:
            return

        # Convert datetimes to proper datetime objects
        starting_date_and_time = get_datetime(self.starting_date_and_time)
        ending_date_and_time = get_datetime(self.ending_date_and_time)

        if starting_date_and_time > ending_date_and_time:
            frappe.throw(
                msg=_("Starting Date and Time cannot be after Ending Date and Time."),
                title=_("Validation Error")
                )

    @frappe.whitelist()
    def calculate_and_validate_fuel_data(self):
        """
        Validate odometer readings and calculate distance traveled and fuel consumption per km.
        Automatically updates the fields on the same document.
        """
        # Validate odometer readings
        if self.initial_odometer_reading > self.final_odometer_reading:
            frappe.throw(_("Initial Odometer Reading must be less than  Final Odometer Reading"))

        # Calculate distance traveled
        if self.final_odometer_reading and self.initial_odometer_reading:
            self.distance_traveledkm = self.final_odometer_reading - self.initial_odometer_reading
        else:
            self.distance_traveledkm = 0

        # Calculate fuel consumption per km
        if self.fuel_consumed and self.fuel_consumed != 0 and self.distance_traveledkm:
            self.mileage = self.distance_traveledkm / self.fuel_consumed
        else:
            self.mileage = 0



@frappe.whitelist()
def get_last_odometer(vehicle):
    if not vehicle:
        return 0

    # Check if a Trip Sheet exists for the given vehicle
    last_trip_exists = frappe.db.exists(
        "Trip Sheet",
        {"vehicle": vehicle, "docstatus": 1},  # Only consider submitted Trip Sheets
    )

    if last_trip_exists:
        # Fetch the final_odometer of the last Trip Sheet
        final_odometer = frappe.db.get_value(
            "Trip Sheet",
            {"vehicle": vehicle, "docstatus": 1},
            "final_odometer_reading",
            order_by="creation desc",  # Ensure the latest trip sheet is fetched
        )
        return final_odometer or 0  # Return the final odometer or 0 if not found
    else:
        return 0  # Return 0 if no trip sheet exists for the vehicle

@frappe.whitelist()
def get_selected_requests(child_table, fieldname):
    '''
    Retrieve specific field values from a child table for submitted Trip Sheet documents.

    This function collects values from the specified field in a child table where the parent
    document belongs to the "Trip Sheet" doctype and is in the submitted state (docstatus=1).
    The values are returned as a list.

    Args:
        child_table (str): The name of the child table to retrieve data from.
        fieldname (str): The field in the child table whose values need to be fetched.
    Returns:
        list: A list of values from the specified field. If no matching records are found or the field is empty, an empty list is returned..
    '''
    selected_requests = []
    eligible_parents = frappe.db.get_all("Trip Sheet", {"docstatus": 1}, pluck="name")
    result = frappe.db.get_all(
        child_table,
        filters={"parent": ["in", eligible_parents]},
        fields=[fieldname]
    )
    
    for doc in result:
        if doc.get(fieldname):
            selected_requests.append(doc.get(fieldname))

    return selected_requests
