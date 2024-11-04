package Routes;

public class Route {
    private int id;
    private String name;
    private double length;
    private double weightRestriction;

    public Route() {
    }

    @Override
    public String toString() {
        return "Route{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", length=" + length +
                ", weightRestriction=" + weightRestriction +
                '}';
    }

    public Route(int id, String name, double length, double WeightRestriction) {
        this.id = id;
        this.name = name;
        this.length = length;
        this.weightRestriction = WeightRestriction;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public double getLength() { return length; }
    public double getWeightRestriction() { return weightRestriction; }
}
