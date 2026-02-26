import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Trade = {
    id : Nat;
    date : Int;
    stockName : Text;
    tradeType : Text;
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

  let userProfiles = Map.empty<Principal, UserProfile>();

  public type UserData = {
    trades : Map.Map<Nat, Trade>;
    var nextTradeId : Nat;
    var dailyMaxLoss : Float;
    var accountSize : Float;
  };

  let users = Map.empty<Principal, UserData>();

  func getOrCreateUserData(caller : Principal) : UserData {
    switch (users.get(caller)) {
      case (?userData) {
        userData;
      };
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

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
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

  func calculatePnl(trade : Trade) : Float {
    (trade.exitPrice - trade.entryPrice) * trade.quantity.toFloat();
  };

  public shared ({ caller }) func addTrade(
    date : Int,
    stockName : Text,
    tradeType : Text,
    direction : Text,
    entryPrice : Float,
    exitPrice : Float,
    stopLoss : Float,
    target : Float,
    quantity : Nat,
    isAPlusSetup : Bool,
    emotion : Text,
    convictionLevel : Nat,
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

    let userData = getOrCreateUserData(caller);
    let id = userData.nextTradeId;

    let trade : Trade = {
      id;
      date;
      stockName;
      tradeType;
      direction;
      entryPrice;
      exitPrice;
      stopLoss;
      target;
      quantity;
      riskRewardRatio = (target - entryPrice) / (entryPrice - stopLoss);
      pnl = (exitPrice - entryPrice) * quantity.toFloat();
      isAPlusSetup;
      emotion;
      convictionLevel;
      followedPlan;
      mistakeType;
      notes;
    };

    userData.trades.add(id, trade);
    userData.nextTradeId += 1;
    id;
  };

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

  public shared ({ caller }) func updateTrade(
    id : Nat,
    date : Int,
    stockName : Text,
    tradeType : Text,
    direction : Text,
    entryPrice : Float,
    exitPrice : Float,
    stopLoss : Float,
    target : Float,
    quantity : Nat,
    isAPlusSetup : Bool,
    emotion : Text,
    convictionLevel : Nat,
    followedPlan : Bool,
    mistakeType : Text,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update trades");
    };
    if (convictionLevel < 1 or convictionLevel > 5) {
      Runtime.trap("Conviction level must be between 1 and 5");
    };

    switch (users.get(caller)) {
      case (?userData) {
        if (not userData.trades.containsKey(id)) {
          Runtime.trap("Trade not found.");
        };
        let trade : Trade = {
          id;
          date;
          stockName;
          tradeType;
          direction;
          entryPrice;
          exitPrice;
          stopLoss;
          target;
          quantity;
          riskRewardRatio = (target - entryPrice) / (entryPrice - stopLoss);
          pnl = (exitPrice - entryPrice) * quantity.toFloat();
          isAPlusSetup;
          emotion;
          convictionLevel;
          followedPlan;
          mistakeType;
          notes;
        };
        userData.trades.add(id, trade);
      };
      case (null) {
        Runtime.trap("Trade not found.");
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

  public shared ({ caller }) func setDailyMaxLoss(limit : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set daily max loss");
    };
    let userData = getOrCreateUserData(caller);
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
    let userData = getOrCreateUserData(caller);
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

  public type Backup = {
    trades : [Trade];
    dailyMaxLoss : Float;
    accountSize : Float;
  };

  public query ({ caller }) func exportBackup() : async Backup {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can export backups");
    };
    switch (users.get(caller)) {
      case (?userData) {
        {
          trades = userData.trades.values().toArray().sort();
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
    let userData = getOrCreateUserData(caller);
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

  public query ({ caller }) func calculatePnlQuery(trade : Trade) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can calculate PnL");
    };
    calculatePnl(trade);
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
    Time.now();
  };
};
