package Tickets;
import Vehicles.Vehicle;
import Routes.Route;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Ticket {
    private int id;
    private Vehicle vehicle;
    private  Route route;
    private  LocalDateTime dateTime;
    private  String violationDetails;

    // Constructor
    public Ticket(Vehicle vehicle, Route route, String violationDetails) {
        this.vehicle = vehicle;
        this.route = route;
        this.dateTime = LocalDateTime.now(); // Default to current time
        this.violationDetails = violationDetails;
    }

    public Ticket() {
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public Route getRoute() {
        return route;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public String getViolationDetails() {
        return violationDetails;
    }


    // Method to display ticket details
    public void displayTicket() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M/d/y h:mm a");
        System.out.println("-------------------------------------\n " );
        System.out.println("Vehicle Type: " + vehicle.getType());
        System.out.println("plate number: " + vehicle.getLicensePlate());
        System.out.println("Route: " + route.getName());
        System.out.println("Violation Details: " + violationDetails);
        int fine = 213;
        System.out.println("Fine : $ " + fine);
        System.out.println("Issued at : " + dateTime.format(formatter));
        System.out.println("-------------------------------------\n " );

    }



}



