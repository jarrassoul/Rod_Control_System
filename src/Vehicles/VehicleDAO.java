package Vehicles;

import Configuration.DatabaseConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.sql.Connection;

public class VehicleDAO {

    // Method to add a new Vehicle to the database
    public void addVehicle(Vehicle vehicle) throws SQLException {
        String sql = "INSERT INTO Vehicle (type, weight, licensePlate) VALUES (?, ?, ?)";

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement pstmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            pstmt.setString(1, vehicle.getType());
            pstmt.setDouble(2, vehicle.getWeight());
            pstmt.setString(3, vehicle.getLicensePlate());

            pstmt.executeUpdate();

            // Optionally retrieve the generated id
            try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    vehicle.setId(generatedKeys.getInt(1)) ;
                }
            }
        }
    }

    // Method to retrieve a Vehicle by ID
    public Vehicle getVehicleById(int id) throws SQLException {
        String sql = "SELECT * FROM Vehicle WHERE id = ?";
        Vehicle vehicle = null;

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement pstmt = connection.prepareStatement(sql)) {

            pstmt.setInt(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    vehicle = new Vehicle(
                            rs.getInt("id"),
                            rs.getString("type"),
                            rs.getDouble("weight"),
                            rs.getString("licensePlate")
                    );
                }
            }
        }
        return vehicle;
    }

    // Method to retrieve all Vehicles
    public List<Vehicle> getAllVehicles() throws SQLException {
        List<Vehicle> vehicles = new ArrayList<>();
        String sql = "SELECT * FROM Vehicle";

        try (Connection connection = DatabaseConnection.connect();
             Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                Vehicle vehicle = new Vehicle(
                        rs.getInt("id"),
                        rs.getString("type"),
                        rs.getDouble("weight"),
                        rs.getString("licensePlate")
                );
                vehicles.add(vehicle);
            }
        }
        return vehicles;
    }

    // Method to update a Vehicle
    public void updateVehicle(Vehicle vehicle) throws SQLException {
        String sql = "UPDATE Vehicle SET type = ?, weight = ?, license_plate = ? WHERE id = ?";

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement pstmt = connection.prepareStatement(sql)) {

            pstmt.setString(1, vehicle.getType());
            pstmt.setDouble(2, vehicle.getWeight());
            pstmt.setString(3, vehicle.getLicensePlate());
            pstmt.setInt(4, vehicle.getId());

            pstmt.executeUpdate();
        }
    }

    // Method to delete a Vehicle
    public void deleteVehicle(int id) throws SQLException {
        String sql = "DELETE FROM Vehicle WHERE id = ?";

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement pstmt = connection.prepareStatement(sql)) {

            pstmt.setInt(1, id);
            pstmt.executeUpdate();
        }
    }
}
