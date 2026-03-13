import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Char "mo:core/Char";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Types
  type Trade = {
    id : Nat;
    date : Int;
    stockName : Text;
    marketType : MarketType;
    direction : Text;
    entryPrice : Float;
    exitPrice : Float;
    stopLoss : Float;
    target : Float;
    quantity : Nat;
    riskRewardRatio : Float;
    pnl : Float;
    isAPlusSetup : Bool;
    emotion : Text;
    convictionLevel : Nat;
    strategy : Text;
    followedPlan : Bool;
    mistakeType : Text;
    notes : Text;
  };

  module Trade {
    public func compare(a : Trade, b : Trade) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  type UserProfile = {
    name : Text;
  };

  type UpdateTradeRecord = {
    entryPrice : Float;
    stopLoss : Float;
    target : Float;
    pnl : Float;
    strategy : Text;
    emotion : Text;
    notes : Text;
  };

  type MarketType = {
    #stocks;
    #future;
    #option;
    #cryptocurrency;
    #forex;
  };

  type Backup = {
    trades : [Trade];
    dailyMaxLoss : Float;
    accountSize : Float;
  };

  public type UserData = {
    trades : Map.Map<Nat, Trade>;
    var nextTradeId : Nat;
    var dailyMaxLoss : Float;
    var accountSize : Float;
  };

  func toLower(c : Char) : Char {
    let code = c.toNat32();
    if (code >= 65 and code <= 90) {
      Char.fromNat32(code + 32);
    } else {
      c;
    };
  };

  func toLowercase(s : Text) : Text {
    s.map(toLower);
  };

  // Converts a character to uppercase if it is a lowercase ASCII letter.
  func toUpper(c : Char) : Char {
    let code = c.toNat32();
    if (code >= 97 and code <= 122) {
      Char.fromNat32(code - 32);
    } else {
      c;
    };
  };

  func calculateRiskRewardRatio(entryPrice : Float, stopLoss : Float, target : Float) : Float {
    let risk = Float.abs(entryPrice - stopLoss);
    let reward = Float.abs(target - entryPrice);
    if (risk == 0.0) { return 0.0 };
    reward / risk;
  };

  // Direction-aware P&L calculation
  func calculatePnl(direction : Text, entryPrice : Float, exitPrice : Float, quantity : Nat) : Float {
    let quantityFloat = quantity.toInt().toFloat();
    let normalizedDirection = toLowercase(direction);

    if (normalizedDirection == "buy" or normalizedDirection == "long") {
      (exitPrice - entryPrice) * quantityFloat;
    } else if (normalizedDirection == "sell" or normalizedDirection == "short") {
      (entryPrice - exitPrice) * quantityFloat;
    } else {
      0.0;
    };
  };

  func getOrCreateStrategyMap(strategies : Map.Map<Principal, Map.Map<Text, Int>>, caller : Principal) : Map.Map<Text, Int> {
    switch (strategies.get(caller)) {
      case (?userStrategies) { userStrategies };
      case (null) {
        let newMap = Map.empty<Text, Int>();
        strategies.add(caller, newMap);
        newMap;
      };
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let users = Map.empty<Principal, UserData>();
  let strategies = Map.empty<Principal, Map.Map<Text, Int>>(); // Store timestamps as Int
  let userProfiles = Map.empty<Principal, UserProfile>();

  func getOrCreateUserData(users : Map.Map<Principal, UserData>, caller : Principal) : UserData {
    switch (users.get(caller)) {
      case (?userData) { userData };
      case (null) {
        let newUserData = {
          trades = Map.empty<Nat, Trade>();
          var nextTradeId = 1;
          var dailyMaxLoss = 20.0;
          var accountSize = 1000.0;
        };
        users.add(caller, newUserData);
        newUserData;
      };
    };
  };

  func saveStrategyInternal(strategies : Map.Map<Principal, Map.Map<Text, Int>>, caller : Principal, name : Text) {
    if (name == "") { return() };
    let userStrategies = getOrCreateStrategyMap(strategies, caller);
    if (not userStrategies.containsKey(name)) {
      let timestamp = Time.now();
      userStrategies.add(name, timestamp);
    };
  };

  // Auth
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Trading Journal (correct handling of PNL)
  public shared ({ caller }) func addTrade(
    date : Int,
    stockName : Text,
    marketType : MarketType,
    direction : Text,
    entryPrice : Float,
    exitPrice : Float,
    stopLoss : Float,
    target : Float,
    quantity : Nat,
    isAPlusSetup : Bool,
    emotion : Text,
    convictionLevel : Nat,
    strategy : Text,
    followedPlan : Bool,
    mistakeType : Text,
    notes : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add trades");
    };
    if (convictionLevel < 1 or convictionLevel > 5) {
      Runtime.trap("Conviction level must be between 1 and 5");
    };

    let userData = getOrCreateUserData(users, caller);
    let id = userData.nextTradeId;

    let trade : Trade = {
      id;
      date;
      stockName;
      marketType;
      direction;
      entryPrice;
      exitPrice;
      stopLoss;
      target;
      quantity;
      riskRewardRatio = calculateRiskRewardRatio(entryPrice, stopLoss, target);
      pnl = calculatePnl(direction, entryPrice, exitPrice, quantity);
      isAPlusSetup;
      emotion;
      convictionLevel;
      strategy;
      followedPlan;
      mistakeType;
      notes;
    };

    userData.trades.add(id, trade);
    userData.nextTradeId += 1;

    // Save strategy if non-empty
    saveStrategyInternal(strategies, caller, strategy);

    id;
  };

  public shared ({ caller } : { caller : Principal }) func updateTrade(tradeId : Nat, update : UpdateTradeRecord) : async ?Trade {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update trades");
    };

    switch (users.get(caller)) {
      case (?userData) {
        switch (userData.trades.get(tradeId)) {
          case (?existingTrade) {
            let updatedTrade = {
              existingTrade with
              entryPrice = update.entryPrice;
              exitPrice = update.pnl;
              stopLoss = update.stopLoss;
              target = update.target;
              pnl = calculatePnl(
                existingTrade.direction,
                existingTrade.entryPrice,
                existingTrade.exitPrice,
                existingTrade.quantity,
              );
              isAPlusSetup = existingTrade.isAPlusSetup;
              emotion = update.emotion;
              convictionLevel = existingTrade.convictionLevel;
              strategy = update.strategy;
              followedPlan = existingTrade.followedPlan;
              mistakeType = existingTrade.mistakeType;
              notes = update.notes;
              riskRewardRatio = calculateRiskRewardRatio(update.entryPrice, update.stopLoss, update.target);
            };
            userData.trades.add(tradeId, updatedTrade);

            // Save strategy if non-empty
            saveStrategyInternal(strategies, caller, update.strategy);

            ?updatedTrade;
          };
          case (null) { Runtime.trap("Trade not found.") };
        };
      };
      case (null) { Runtime.trap("Trade not found.") };
    };
  };

  // Strategies
  public query ({ caller }) func getStrategies() : async [(Text, Int)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get strategies");
    };
    switch (strategies.get(caller)) {
      case (?userStrategies) {
        userStrategies.toArray();
      };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func saveStrategy(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save strategies");
    };
    saveStrategyInternal(strategies, caller, name);
  };

  public shared ({ caller }) func deleteStrategy(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete strategies");
    };
    let userStrategies = getOrCreateStrategyMap(strategies, caller);
    if (not userStrategies.containsKey(name)) {
      Runtime.trap("Strategy not found.");
    };
    userStrategies.remove(name);
  };

  // Trades
  public query ({ caller }) func getTradeById(id : Nat) : async ?Trade {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };
    switch (users.get(caller)) {
      case (?userData) {
        userData.trades.get(id);
      };
      case (null) {
        null;
      };
    };
  };

  public query ({ caller }) func getTrades() : async [Trade] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };
    switch (users.get(caller)) {
      case (?userData) {
        let sortedTradesIter = userData.trades.values();
        let sortedTrades = sortedTradesIter.toArray().sort();
        sortedTrades;
      };
      case (null) {
        [];
      };
    };
  };

  public shared ({ caller }) func deleteTrade(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete trades");
    };
    switch (users.get(caller)) {
      case (?userData) {
        if (not userData.trades.containsKey(id)) {
          Runtime.trap("Trade not found.");
        };
        userData.trades.remove(id);
      };
      case (null) {
        Runtime.trap("Trade not found.");
      };
    };
  };

  // Risk settings
  public shared ({ caller }) func setDailyMaxLoss(limit : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set daily max loss");
    };
    let userData = getOrCreateUserData(users, caller);
    userData.dailyMaxLoss := limit;
  };

  public query ({ caller }) func getDailyMaxLoss() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get daily max loss");
    };
    switch (users.get(caller)) {
      case (?userData) {
        userData.dailyMaxLoss;
      };
      case (null) {
        20.0;
      };
    };
  };

  public shared ({ caller }) func setAccountSize(size : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set account size");
    };
    let userData = getOrCreateUserData(users, caller);
    userData.accountSize := size;
  };

  public query ({ caller }) func getAccountSize() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get account size");
    };
    switch (users.get(caller)) {
      case (?userData) {
        userData.accountSize;
      };
      case (null) {
        1000.0;
      };
    };
  };

  public query ({ caller }) func getRiskStatus() : async { dailyMaxLoss : Float; accountSize : Float; totalPnl : Float } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get risk status");
    };
    switch (users.get(caller)) {
      case (?userData) {
        var totalPnl = 0.0;
        for (trade in userData.trades.values()) {
          totalPnl += trade.pnl;
        };
        {
          dailyMaxLoss = userData.dailyMaxLoss;
          accountSize = userData.accountSize;
          totalPnl;
        };
      };
      case (null) {
        { dailyMaxLoss = 20.0; accountSize = 1000.0; totalPnl = 0.0 };
      };
    };
  };

  // Backup & restore
  public query ({ caller }) func exportBackup() : async Backup {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can export backups");
    };
    switch (users.get(caller)) {
      case (?userData) {
        {
          trades = userData.trades.values().toArray();
          dailyMaxLoss = userData.dailyMaxLoss;
          accountSize = userData.accountSize;
        };
      };
      case (null) {
        { trades = []; dailyMaxLoss = 20.0; accountSize = 1000.0 };
      };
    };
  };

  public shared ({ caller }) func importBackup(backup : Backup) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can import backups");
    };
    let userData = getOrCreateUserData(users, caller);
    let newTrades = Map.empty<Nat, Trade>();
    var maxId = 0;
    for (trade in backup.trades.values()) {
      if (trade.id > maxId) {
        maxId := trade.id;
      };
      newTrades.add(trade.id, trade);
    };
    userData.trades.clear();
    for ((id, trade) in newTrades.entries()) {
      userData.trades.add(id, trade);
    };
    userData.nextTradeId := maxId + 1;
    userData.dailyMaxLoss := backup.dailyMaxLoss;
    userData.accountSize := backup.accountSize;
  };

  // Risk per Trade calculation
  public query ({ caller }) func calculatePnlQuery(trade : Trade) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can calculate PnL");
    };
    let quantityFloat = trade.quantity.toInt().toFloat();
    let normalizedDirection = toLowercase(trade.direction);

    if (normalizedDirection == "buy" or normalizedDirection == "long") {
      (trade.exitPrice - trade.entryPrice) * quantityFloat;
    } else if (normalizedDirection == "sell" or normalizedDirection == "short") {
      (trade.entryPrice - trade.exitPrice) * quantityFloat;
    } else {
      0.0;
    };
  };

  public query ({ caller }) func getTotalTradesCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get trade count");
    };
    switch (users.get(caller)) {
      case (?userData) {
        userData.trades.size();
      };
      case (null) {
        0;
      };
    };
  };

  public query ({ caller }) func getCurrentTimestamp() : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get current timestamp");
    };
    Time.now();
  };

  public query ({ caller }) func getTradesByStrategy(strategy : Text) : async [Trade] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades by strategy");
    };
    switch (users.get(caller)) {
      case (?userData) {
        let filteredTrades = List.empty<Trade>();
        for (trade in userData.trades.values()) {
          if (trade.strategy == strategy) {
            filteredTrades.add(trade);
          };
        };
        filteredTrades.toArray();
      };
      case (null) {
        [];
      };
    };
  };
};
