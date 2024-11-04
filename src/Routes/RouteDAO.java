package Routes;
import Configuration.DatabaseConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.sql.Connection;

public class RouteDAO {

    // Method to add a new Route to the database
    public static void addRoute(Route route) throws SQLException {
        String sql = "INSERT INTO Route (name, length, weightRestriction) VALUES (?, ?, ?)";

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement pstmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            pstmt.setString(1, route.getName());
            pstmt.setDouble(2, route.getLength());
            pstmt.setDouble(3, route.getWeightRestriction());

            pstmt.executeUpdate();

            // Optionally retrieve the generated id
            try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    route.setId(generatedKeys.getInt(1)) ;
                }
            }
        }
    }

    // Method to retrieve a Route by ID
    public Route getRouteById(int id) throws SQLException {
        String sql = "SELECT * FROM Route WHERE id = ?";
        Route route = null;

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement pstmt = connection.prepareStatement(sql)) {

            pstmt.setInt(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    route = new Route(
                            rs.getInt("id"),
                            rs.getString("name"),
                            rs.getDouble("length"),
                            rs.getDouble("weightRestriction")
                    );
                }
            }
        }
        return route;
    }

    // Method to retrieve all Routes
    public List<Route> getAllRoutes() throws SQLException {
        List<Route> routes = new ArrayList<>();
        String sql = "SELECT * FROM Route";

        try (Connection connection = DatabaseConnection.connect();
             Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                Route route = new Route(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getDouble("length"),
                        rs.getDouble("weightRestriction")
                );
                routes.add(route);
            }
        }
        return routes;
    }

    // Method to update a Route
    public void updateRoute(Route route) throws SQLException {
        String sql = "UPDATE Route SET name = ?, length = ?, weightRestriction = ? WHERE id = ?";

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement pstmt = connection.prepareStatement(sql)) {

            pstmt.setString(1, route.getName());
            pstmt.setDouble(2, route.getLength());
            pstmt.setDouble(3, route.getWeightRestriction());
            pstmt.setInt(4, route.getId());

            pstmt.executeUpdate();
        }
    }

    // Method to delete a Route
    public void deleteRoute(int id) throws SQLException {
        String sql = "DELETE FROM Route WHERE id = ?";

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement pstmt = connection.prepareStatement(sql)) {

            pstmt.setInt(1, id);
            pstmt.executeUpdate();
        }
    }
}
