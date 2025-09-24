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
    origin: ["https://your-admin.vercel.app", "https://your-front.vercel.app"]
}));
app.use(express_1.default.json());
app.use("/api/settings", settings_1.default);
exports.default = app;
