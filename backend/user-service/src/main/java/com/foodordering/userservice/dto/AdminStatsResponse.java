package com.foodordering.userservice.dto;

public class AdminStatsResponse {
    
    private long totalUsers;
    private long totalRestaurantOwners;
    private long totalCustomers;
    private long totalDeliveryDrivers;
    private long activeUsers;
    private long inactiveUsers;

    // Constructors
    public AdminStatsResponse() {}

    public AdminStatsResponse(long totalUsers, long totalRestaurantOwners, long totalCustomers, 
                            long totalDeliveryDrivers, long activeUsers, long inactiveUsers) {
        this.totalUsers = totalUsers;
        this.totalRestaurantOwners = totalRestaurantOwners;
        this.totalCustomers = totalCustomers;
        this.totalDeliveryDrivers = totalDeliveryDrivers;
        this.activeUsers = activeUsers;
        this.inactiveUsers = inactiveUsers;
    }

    // Getters and Setters
    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getTotalRestaurantOwners() { return totalRestaurantOwners; }
    public void setTotalRestaurantOwners(long totalRestaurantOwners) { this.totalRestaurantOwners = totalRestaurantOwners; }

    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }

    public long getTotalDeliveryDrivers() { return totalDeliveryDrivers; }
    public void setTotalDeliveryDrivers(long totalDeliveryDrivers) { this.totalDeliveryDrivers = totalDeliveryDrivers; }

    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }

    public long getInactiveUsers() { return inactiveUsers; }
    public void setInactiveUsers(long inactiveUsers) { this.inactiveUsers = inactiveUsers; }

    // Builder
    public static AdminStatsResponseBuilder builder() {
        return new AdminStatsResponseBuilder();
    }

    public static class AdminStatsResponseBuilder {
        private long totalUsers;
        private long totalRestaurantOwners;
        private long totalCustomers;
        private long totalDeliveryDrivers;
        private long activeUsers;
        private long inactiveUsers;

        public AdminStatsResponseBuilder totalUsers(long totalUsers) { this.totalUsers = totalUsers; return this; }
        public AdminStatsResponseBuilder totalRestaurantOwners(long totalRestaurantOwners) { this.totalRestaurantOwners = totalRestaurantOwners; return this; }
        public AdminStatsResponseBuilder totalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; return this; }
        public AdminStatsResponseBuilder totalDeliveryDrivers(long totalDeliveryDrivers) { this.totalDeliveryDrivers = totalDeliveryDrivers; return this; }
        public AdminStatsResponseBuilder activeUsers(long activeUsers) { this.activeUsers = activeUsers; return this; }
        public AdminStatsResponseBuilder inactiveUsers(long inactiveUsers) { this.inactiveUsers = inactiveUsers; return this; }

        public AdminStatsResponse build() {
            return new AdminStatsResponse(totalUsers, totalRestaurantOwners, totalCustomers, 
                                        totalDeliveryDrivers, activeUsers, inactiveUsers);
        }
    }
}
