package com.foodordering.restaurantservice.service;

import com.foodordering.restaurantservice.dto.MenuItemDTO;
import com.foodordering.restaurantservice.dto.MenuItemRequest;
import com.foodordering.restaurantservice.dto.RestaurantDTO;
import com.foodordering.restaurantservice.dto.RestaurantRequest;
import com.foodordering.restaurantservice.entity.MenuItem;
import com.foodordering.restaurantservice.entity.Restaurant;
import com.foodordering.restaurantservice.exception.ResourceNotFoundException;
import com.foodordering.restaurantservice.exception.RestaurantAccessDeniedException;
import com.foodordering.restaurantservice.repository.MenuItemRepository;
import com.foodordering.restaurantservice.repository.RestaurantRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final AuthenticationService authService;
    private final AzureStorageService azureStorageService;

    @Autowired
    public RestaurantService(
            RestaurantRepository restaurantRepository,
            MenuItemRepository menuItemRepository,
            AuthenticationService authService,
            AzureStorageService azureStorageService) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.authService = authService;
        this.azureStorageService = azureStorageService;
    }

    // Restaurant CRUD operations

    public List<RestaurantDTO> getAllRestaurants() {
        return restaurantRepository.findAll().stream()
                .map(this::convertToRestaurantDTO)
                .collect(Collectors.toList());
    }

    public RestaurantDTO getRestaurantById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        return convertToRestaurantDTO(restaurant);
    }

    public RestaurantDTO createRestaurant(RestaurantRequest request) {
        // Set owner ID from authenticated user
        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        // Only RESTAURANT_ADMIN or SYSTEM_ADMIN can create restaurants
        if (!("RESTAURANT_ADMIN".equals(currentUserRole) || "SYSTEM_ADMIN".equals(currentUserRole))) {
            throw new RestaurantAccessDeniedException("Only restaurant admins can create restaurants");
        }

        Restaurant restaurant = new Restaurant();
        restaurant.setName(request.getName());
        restaurant.setOwnerId(currentUserId); // Use authenticated user ID
        restaurant.setAddress(request.getAddress());
        restaurant.setPhone(request.getPhone());
        restaurant.setLatitude(request.getLatitude());  // Set latitude
        restaurant.setLongitude(request.getLongitude());
        restaurant.setActive(true);

        Restaurant savedRestaurant = restaurantRepository.save(restaurant);
        return convertToRestaurantDTO(savedRestaurant);
    }

    //get restaurant by ownerId get the ownerId from the JWT token
    public List<RestaurantDTO> getRestaurantsByOwnerId() {
        Long currentUserId = authService.getCurrentUserId();
        return restaurantRepository.findByOwnerId(currentUserId).stream()
                .map(this::convertToRestaurantDTO)
                .collect(Collectors.toList());
    }

    public RestaurantDTO updateRestaurant(Long id, RestaurantRequest request) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));

        // Verify owner or admin
        if (!authService.isRestaurantOwner(restaurant.getOwnerId())) {
            throw new RestaurantAccessDeniedException("You don't have permission to update this restaurant");
        }

        restaurant.setName(request.getName());
        restaurant.setAddress(request.getAddress());
        restaurant.setPhone(request.getPhone());
        restaurant.setLatitude(request.getLatitude());  // Update latitude
        restaurant.setLongitude(request.getLongitude()); // Update longitude

        Restaurant updatedRestaurant = restaurantRepository.save(restaurant);
        return convertToRestaurantDTO(updatedRestaurant);
    }

    public void deleteRestaurant(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));

        // Verify owner or admin
        if (!authService.isRestaurantOwner(restaurant.getOwnerId())) {
            throw new RestaurantAccessDeniedException("You don't have permission to delete this restaurant");
        }

        restaurantRepository.deleteById(id);
    }

    // Menu Item CRUD operations

    public List<MenuItemDTO> getMenuItemsByRestaurantId(Long restaurantId) {
        if (!restaurantRepository.existsById(restaurantId)) {
            throw new ResourceNotFoundException("Restaurant not found with id: " + restaurantId);
        }

        return menuItemRepository.findByRestaurantId(restaurantId).stream()
                .map(this::convertToMenuItemDTO)
                .collect(Collectors.toList());
    }

    public MenuItemDTO getMenuItemById(Long restaurantId, Long menuItemId) {
        if (!restaurantRepository.existsById(restaurantId)) {
            throw new ResourceNotFoundException("Restaurant not found with id: " + restaurantId);
        }

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + menuItemId));

        if (!menuItem.getRestaurant().getId().equals(restaurantId)) {
            throw new ResourceNotFoundException("Menu item not found in restaurant with id: " + restaurantId);
        }

        return convertToMenuItemDTO(menuItem);
    }

    @Transactional
    public MenuItemDTO createMenuItem(Long restaurantId, MenuItemRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        // Verify owner or admin
        if (!authService.isRestaurantOwner(restaurant.getOwnerId())) {
            throw new RestaurantAccessDeniedException("You don't have permission to add menu items to this restaurant");
        }

        MenuItem menuItem = new MenuItem();
        menuItem.setName(request.getName());
        menuItem.setDescription(request.getDescription());
        menuItem.setPrice(request.getPrice());
        menuItem.setCategory(request.getCategory());
        menuItem.setAvailable(request.isAvailable());
        menuItem.setRestaurant(restaurant);

        MenuItem savedMenuItem = menuItemRepository.save(menuItem);
        return convertToMenuItemDTO(savedMenuItem);
    }

    @Transactional
    public MenuItemDTO updateMenuItem(Long restaurantId, Long menuItemId, MenuItemRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        // Verify owner or admin
        if (!authService.isRestaurantOwner(restaurant.getOwnerId())) {
            throw new RestaurantAccessDeniedException("You don't have permission to update menu items for this restaurant");
        }

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + menuItemId));

        if (!menuItem.getRestaurant().getId().equals(restaurantId)) {
            throw new ResourceNotFoundException("Menu item not found in restaurant with id: " + restaurantId);
        }

        menuItem.setName(request.getName());
        menuItem.setDescription(request.getDescription());
        menuItem.setPrice(request.getPrice());
        menuItem.setCategory(request.getCategory());
        menuItem.setAvailable(request.isAvailable());

        MenuItem updatedMenuItem = menuItemRepository.save(menuItem);
        return convertToMenuItemDTO(updatedMenuItem);
    }

    @Transactional
    public void deleteMenuItem(Long restaurantId, Long menuItemId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        // Verify owner or admin
        if (!authService.isRestaurantOwner(restaurant.getOwnerId())) {
            throw new RestaurantAccessDeniedException("You don't have permission to delete menu items from this restaurant");
        }

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + menuItemId));

        if (!menuItem.getRestaurant().getId().equals(restaurantId)) {
            throw new ResourceNotFoundException("Menu item not found in restaurant with id: " + restaurantId);
        }

        menuItemRepository.delete(menuItem);
    }

    // Helper methods to convert Entity to DTO

    private RestaurantDTO convertToRestaurantDTO(Restaurant restaurant) {
        RestaurantDTO dto = new RestaurantDTO();
        BeanUtils.copyProperties(restaurant, dto);

        List<MenuItemDTO> menuItemDTOs = restaurant.getMenuItems().stream()
                .map(this::convertToMenuItemDTO)
                .collect(Collectors.toList());

        dto.setMenuItems(menuItemDTOs);
        return dto;
    }

    private MenuItemDTO convertToMenuItemDTO(MenuItem menuItem) {
        MenuItemDTO dto = new MenuItemDTO();
        BeanUtils.copyProperties(menuItem, dto);
        dto.setRestaurantId(menuItem.getRestaurant().getId());
        return dto;
    }
    // Image upload methods for restaurant
    @Transactional
    public RestaurantDTO addRestaurantImage(Long restaurantId, MultipartFile file) throws IOException {
        // Validate file
        validateImageFile(file);

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        // Verify owner or admin
        if (!authService.isRestaurantOwner(restaurant.getOwnerId())) {
            throw new RestaurantAccessDeniedException("You don't have permission to add images to this restaurant");
        }

        // Upload image to Azure Blob Storage
        String imageUrl = azureStorageService.uploadRestaurantImage(file);

        // Add image URL to restaurant
        restaurant.getImageUrls().add(imageUrl);
        Restaurant updatedRestaurant = restaurantRepository.save(restaurant);

        return convertToRestaurantDTO(updatedRestaurant);
    }

    @Transactional
    public RestaurantDTO removeRestaurantImage(Long restaurantId, String imageUrl) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        // Verify owner or admin
        if (!authService.isRestaurantOwner(restaurant.getOwnerId())) {
            throw new RestaurantAccessDeniedException("You don't have permission to remove images from this restaurant");
        }

        // Remove image URL from restaurant
        boolean removed = restaurant.getImageUrls().removeIf(url -> url.equals(imageUrl));

        if (removed) {
            // Delete file from Azure Blob Storage
            azureStorageService.deleteFile(imageUrl);

            Restaurant updatedRestaurant = restaurantRepository.save(restaurant);
            return convertToRestaurantDTO(updatedRestaurant);
        } else {
            throw new ResourceNotFoundException("Image URL not found in restaurant: " + imageUrl);
        }
    }

    // Image upload methods for menu item
    @Transactional
    public MenuItemDTO addMenuItemImage(Long restaurantId, Long menuItemId, MultipartFile file) throws IOException {
        // Validate file
        validateImageFile(file);

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        // Verify owner or admin
        if (!authService.isRestaurantOwner(restaurant.getOwnerId())) {
            throw new RestaurantAccessDeniedException("You don't have permission to add images to this menu item");
        }

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + menuItemId));

        if (!menuItem.getRestaurant().getId().equals(restaurantId)) {
            throw new ResourceNotFoundException("Menu item not found in restaurant with id: " + restaurantId);
        }

        // Upload image to Azure Blob Storage
        String imageUrl = azureStorageService.uploadMenuItemImage(file);

        // Add image URL to menu item
        menuItem.getImageUrls().add(imageUrl);
        MenuItem updatedMenuItem = menuItemRepository.save(menuItem);

        return convertToMenuItemDTO(updatedMenuItem);
    }

    @Transactional
    public MenuItemDTO removeMenuItemImage(Long restaurantId, Long menuItemId, String imageUrl) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        // Verify owner or admin
        if (!authService.isRestaurantOwner(restaurant.getOwnerId())) {
            throw new RestaurantAccessDeniedException("You don't have permission to remove images from this menu item");
        }

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + menuItemId));

        if (!menuItem.getRestaurant().getId().equals(restaurantId)) {
            throw new ResourceNotFoundException("Menu item not found in restaurant with id: " + restaurantId);
        }

        // Remove image URL from menu item
        boolean removed = menuItem.getImageUrls().removeIf(url -> url.equals(imageUrl));

        if (removed) {
            // Delete file from Azure Blob Storage
            azureStorageService.deleteFile(imageUrl);

            MenuItem updatedMenuItem = menuItemRepository.save(menuItem);
            return convertToMenuItemDTO(updatedMenuItem);
        } else {
            throw new ResourceNotFoundException("Image URL not found in menu item: " + imageUrl);
        }
    }

    // Helper method to validate image file
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/"))) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        // Check file size (limit to 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size cannot exceed 5MB");
        }
    }

    // New method to find nearby restaurants
    public List<RestaurantDTO> findNearbyRestaurants(Double latitude, Double longitude, Double distanceInKm) {
        return restaurantRepository.findNearbyRestaurants(latitude, longitude, distanceInKm)
                .stream()
                .map(this::convertToRestaurantDTO)
                .collect(Collectors.toList());
    }

    // Helper method to calculate distance between two points
    public double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371; // Earth radius in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }


}
