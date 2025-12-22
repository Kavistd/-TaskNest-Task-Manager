# IMPORTANT: Restart Instructions

If you're seeing "next is not a function" error, follow these steps:

1. **Stop the server completely:**
   - Press `Ctrl + C` in the terminal where the server is running
   - Wait until it's fully stopped

2. **Clear Node.js cache (optional but recommended):**
   - Delete `node_modules/.cache` if it exists
   - Or just restart - Node.js will reload modules

3. **Start the server again:**
   ```bash
   npm start
   ```

4. **Verify the server started correctly:**
   - You should see "MongoDB connected successfully"
   - Then "Server running on port 5000"

5. **Try registering again**

If the error persists, check the backend console for any error messages.

