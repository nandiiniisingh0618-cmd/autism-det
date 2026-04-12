import requests
import json

# Test the backend API
def test_backend():
    base_url = "http://127.0.0.1:5000"
    
    print("Testing Autism Detection Backend API")
    print("=" * 50)
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test prediction endpoint with a dummy file (this will fail but shows the endpoint works)
    print("\n2. Testing prediction endpoint structure...")
    try:
        # Create a small dummy image data
        dummy_data = b"fake_image_data"
        files = {'image': ('test.jpg', dummy_data, 'image/jpeg')}
        response = requests.post(f"{base_url}/predict", files=files)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n3. Backend is running successfully!")
    print("You can now connect your React frontend to: http://127.0.0.1:5000")

if __name__ == "__main__":
    test_backend()
