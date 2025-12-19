#!/bin/bash
SERVICE_NAME=next-admin.service # 실제 서비스명으로 확인 필수
if systemctl is-active --quiet $SERVICE_NAME; then
    sudo systemctl stop $SERVICE_NAME
fi
