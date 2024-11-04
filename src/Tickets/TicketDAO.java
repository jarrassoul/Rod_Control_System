package Tickets;
import Vehicles.Vehicle;
import Routes.Route;import Configuration.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;

public class TicketDAO {
    public static void addTicket(Ticket ticket) {
        String sql = "INSERT INTO Ticket ( vehicle_id, route_id,dateTime, violationDetails) VALUES (?, ?, ?,?)";
        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement pstmt = connection.prepareStatement(sql, (Statement.RETURN_GENERATED_KEYS))) {
            pstmt.setInt(1, ticket.getVehicle().getId());
            pstmt.setInt(2, ticket.getRoute().getId());
            pstmt.setString(3, String.valueOf(ticket.getDateTime()));
            pstmt.setString(4, ticket.getViolationDetails());

            pstmt.executeUpdate();
            System.out.println("Ticket generated successfully.");
        } catch (SQLException e) {
            System.out.println("Failed to generate ticket.");
            e.printStackTrace();
        }
    }

    public   void generateTicket(Vehicle v, Route r) {

        if (v.getWeight() > r.getWeightRestriction()) {
            String violationDetails = "Exceeded weight limit of " + r.getWeightRestriction() + " kg";
            Ticket ticket = new Ticket(v, r, violationDetails);
            addTicket(ticket);
            ticket.displayTicket();
        } else {
            System.out.println("Happy travels. No ticket for you :D :D ");
        }

    }
}
