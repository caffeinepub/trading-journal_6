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
export interface UserProfile {
    name: string;
}
export interface Trade {
    id: bigint;
    pnl: number;
    direction: string;
    stockName: string;
    tradeType: string;
    emotion: string;
    date: bigint;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTrade(date: bigint, stockName: string, tradeType: string, direction: string, entryPrice: number, exitPrice: number, stopLoss: number, target: number, quantity: bigint, isAPlusSetup: boolean, emotion: string, convictionLevel: bigint, followedPlan: boolean, mistakeType: string, notes: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculatePnlQuery(trade: Trade): Promise<number>;
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
    getTotalTradesCount(): Promise<bigint>;
    getTradeById(id: bigint): Promise<Trade | null>;
    getTrades(): Promise<Array<Trade>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importBackup(backup: Backup): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAccountSize(size: number): Promise<void>;
    setDailyMaxLoss(limit: number): Promise<void>;
    updateTrade(id: bigint, date: bigint, stockName: string, tradeType: string, direction: string, entryPrice: number, exitPrice: number, stopLoss: number, target: number, quantity: bigint, isAPlusSetup: boolean, emotion: string, convictionLevel: bigint, followedPlan: boolean, mistakeType: string, notes: string): Promise<void>;
}
