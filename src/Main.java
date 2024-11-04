import Routes.RouteDAO;
import Routes.Route;
import Utiles.Utiles;
import Tickets.TicketDAO;
import Vehicles.Vehicle;
import java.util.List;
import java.util.Scanner;


public class Main {

    public static void main(String[] args) throws ClassNotFoundException {
        RouteDAO routeDAO = new RouteDAO();
        TicketDAO ticketDAO = new TicketDAO();
        Utiles utils = new Utiles();
        Scanner scanner = new Scanner(System.in);

        System.out.printf(
                "%n%s%n%s%n%s%n%s%n%s%n%s%n%n",
                "-----------------------------------------------",
                "-----------------------------------------------",
                "Welcome to the Vehicle Weight Detector System",
                "VWDS is a virtual vehicle weight violation detector system that allows route authorities to track any weight violation in their routes.",
                "-----------------------------------------------",
                "-----------------------------------------------"
        );

        System.out.println("1. Start the application");
        System.out.println("2. Exit");
        System.out.print("Enter your choice: ");
        int option = scanner.nextInt();
        scanner.nextLine();
        switch (option) {

            case 1:
                System.out.println("-----------------------------------------------");
                System.out.println("Enter vehicle type: ");
                String type = scanner.nextLine();
                System.out.println("-----------------------------------------------");
                String licensePlate;
                while (true) {
                    System.out.println("-----------------------------------------------");
                    System.out.println("Enter vehicle license plate (Format: ABC-1234): ");
                    licensePlate = scanner.nextLine();
                    if (utils.isValidPALicensePlate(licensePlate)) {
                        break;
                    } else {
                        System.out.println("Invalid license plate format. Please enter a valid format (e.g., ABC-1234).");
                    }
                }

                double weight = 0;
                while (true) {
                    System.out.println("-----------------------------------------------");
                    System.out.println("Enter vehicle weight: ");
                    weight = scanner.nextDouble();
                    if (utils.isValidHeavyTruckWeight(weight)) {
                        break;
                    } else {
                        System.out.println("Enter a valid weight. Should be less than 100,000 Kg");
                    }
                }
                Vehicle newVehicle = new Vehicle(1, type, weight, licensePlate);
                System.out.println("-----------------------------------------------");

                System.out.println(newVehicle.toString());


                try {

                    List<Route> routes = (List<Route>) routeDAO.getAllRoutes();
                    Route selectedRoute = null;
                    while (true) {

                        System.out.println("\nSelect an option:");
                        System.out.println("1. View all routes and select a route");
                        System.out.println("2. Exit");
                        System.out.print("Enter your choice: ");
                        int choice = scanner.nextInt();

                        switch (choice) {
                            case 1:
                                // Display all routes with numbering
                                for (int i = 0; i < routes.size(); i++) {
                                    Route r = routes.get(i);
                                    System.out.println((i + 1) + ". Name: " + r.getName() + ", Weight Restriction: " + r.getWeightRestriction() + " kg");
                                }

                                // Prompt user to select a route
                                System.out.print("Select a route by number: ");
                                int routeIndex = scanner.nextInt();
                                if (routeIndex > 0 && routeIndex <= routes.size()) {
                                    selectedRoute = routes.get(routeIndex - 1);
                                    System.out.println("Selected route: " + selectedRoute.getName() + " with weight restriction: " + selectedRoute.getWeightRestriction() + " kg");
                                    ticketDAO.generateTicket(newVehicle, selectedRoute);
                                    scanner.close();
                                    return;
                                } else {
                                    System.out.println("Invalid route selection.");
                                }
                                break;

                            case 2:
                                System.out.println("Exiting...");
                                scanner.close();
                                return;

                            default:
                                System.out.println("Invalid choice");
                        }
                    }
                } catch (Exception e) {
                    System.out.println("An error occurred while processing.");
                }
            case 2 :
                System.out.println("Exiting...");
                scanner.close();
                return;

            default:
                System.out.println("Invalid choice");


        }




    }





}

