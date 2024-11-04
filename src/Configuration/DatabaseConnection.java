package Configuration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {

    // Database URL, includes user and password information
    private static final String DB_URL = "jdbc:mysql://localhost:3306/weigth_restric_db?user=root&password=Cs5@11464.";

    public static Connection connect() {
        Connection connection = null;
        try {
            // Register MySQL JDBC driver (optional in recent versions but good practice)
            Class.forName("com.mysql.cj.jdbc.Driver");

            // Connect to the database
            connection = DriverManager.getConnection(DB_URL);
//            System.out.println("Connected to the database successfully.");
        } catch (ClassNotFoundException e) {
            System.out.println("MySQL JDBC Driver not found.");
            e.printStackTrace();
        } catch (SQLException e) {
            System.out.println("Connection failed.");
            e.printStackTrace();
        }
        return connection;
    }

    public static void main(String[] args) {
        // Test the connection
        Connection conn = connect();
        if (conn != null) {
            try {
                conn.close(); // Close the connection after testing
                System.out.println("Connection closed.");
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
