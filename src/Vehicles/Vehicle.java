package Vehicles;

public class Vehicle {
    private int id;
    private String type;
    private double weight;
    private String licensePlate;

    public Vehicle() {
    }

    public void setId(int id) {
        this.id = id;
    }

    public Vehicle(int id, String type, double weight, String licensePlate) {
        this.id = id;
        this.type = type;
        this.weight = weight;
        this.licensePlate = licensePlate;
    }

    public int getId() { return id; }
    public String getType() { return type; }
    public double getWeight() { return weight; }
    public String getLicensePlate() { return licensePlate; }

    @Override
    public String toString() {
        return "Vehicle{" +
                "id=" + id +
                ", type='" + type + '\'' +
                ", weight=" + weight +
                ", licensePlate='" + licensePlate + '\'' +
                '}';
    }

}
