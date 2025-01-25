# Use the official Node.js image as a base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose port 8080 to access the server
EXPOSE 8082

# Start the application
CMD ["node", "cors-proxy.js"]
