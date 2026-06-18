

This config exposes the app on VM port 80.

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:5000/api`



sudo cp todo-app.conf /etc/nginx/sites-available/todo-app.conf
sudo ln -s /etc/nginx/sites-available/todo-app.conf /etc/nginx/sites-enabled/todo-app.conf
sudo nginx -t
sudo systemctl reload nginx

If the default Nginx site is already enabled and conflicts on port 80:


sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx


Keep the frontend running on port `5173` and backend on port `5000`.
