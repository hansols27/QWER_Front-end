#!/bin/bash
SERVICE_NAME=next-admin.service
sudo systemctl daemon-reload
sudo systemctl restart $SERVICE_NAME
sudo systemctl enable $SERVICE_NAME
