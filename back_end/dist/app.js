"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const settings_1 = __importDefault(require("./routes/settings"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [
        "https://qwer-fansite-admin.vercel.app", // admin 페이지의 실제 URL
        "https://qwer-fansite-front.vercel.app" // front_end 페이지의 실제 URL 
    ]
}));
app.use(express_1.default.json());
app.use("/api/settings", settings_1.default);
exports.default = app;
