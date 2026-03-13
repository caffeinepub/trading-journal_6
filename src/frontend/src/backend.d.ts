import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Backup {
    trades: Array<Trade>;
    accountSize: number;
    dailyMaxLoss: number;
}
export interface UpdateTradeRecord {
    pnl: number;
    emotion: string;
    strategy: string;
    target: number;
    stopLoss: number;
    notes: string;
    entryPrice: number;
}
export interface UserProfile {
    name: string;
}
export interface Trade {
    id: bigint;
    pnl: number;
    marketType: MarketType;
    direction: string;
    stockName: string;
    emotion: string;
    date: bigint;
    strategy: string;
    mistakeType: string;
    followedPlan: boolean;
    target: number;
    convictionLevel: bigint;
    stopLoss: number;
    notes: string;
    quantity: bigint;
    entryPrice: number;
    isAPlusSetup: boolean;
    exitPrice: number;
    riskRewardRatio: number;
}
export enum MarketType {
    cryptocurrency = "cryptocurrency",
    forex = "forex",
    stocks = "stocks",
    option = "option",
    future = "future"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTrade(date: bigint, stockName: string, marketType: MarketType, direction: string, entryPrice: number, exitPrice: number, stopLoss: number, target: number, quantity: bigint, isAPlusSetup: boolean, emotion: string, convictionLevel: bigint, strategy: string, followedPlan: boolean, mistakeType: string, notes: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculatePnlQuery(trade: Trade): Promise<number>;
    deleteStrategy(name: string): Promise<void>;
    deleteTrade(id: bigint): Promise<void>;
    exportBackup(): Promise<Backup>;
    getAccountSize(): Promise<number>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentTimestamp(): Promise<bigint>;
    getDailyMaxLoss(): Promise<number>;
    getRiskStatus(): Promise<{
        totalPnl: number;
        accountSize: number;
        dailyMaxLoss: number;
    }>;
    getStrategies(): Promise<Array<[string, bigint]>>;
    getTotalTradesCount(): Promise<bigint>;
    getTradeById(id: bigint): Promise<Trade | null>;
    getTrades(): Promise<Array<Trade>>;
    getTradesByStrategy(strategy: string): Promise<Array<Trade>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importBackup(backup: Backup): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveStrategy(name: string): Promise<void>;
    setAccountSize(size: number): Promise<void>;
    setDailyMaxLoss(limit: number): Promise<void>;
    updateTrade(tradeId: bigint, update: UpdateTradeRecord): Promise<Trade | null>;
}
