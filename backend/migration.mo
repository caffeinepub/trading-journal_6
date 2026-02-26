import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";

module {
  type OldTrade = {
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
    followedPlan : Bool;
    mistakeType : Text;
    notes : Text;
  };

  type OldUserData = {
    trades : Map.Map<Nat, OldTrade>;
    var nextTradeId : Nat;
    var dailyMaxLoss : Float;
    var accountSize : Float;
  };

  type OldActor = {
    users : Map.Map<Principal, OldUserData>;
  };

  type NewTrade = {
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

  type NewUserData = {
    trades : Map.Map<Nat, NewTrade>;
    var nextTradeId : Nat;
    var dailyMaxLoss : Float;
    var accountSize : Float;
  };

  type NewActor = {
    users : Map.Map<Principal, NewUserData>;
  };

  public func run(old : OldActor) : NewActor {
    let newUsers = old.users.map<Principal, OldUserData, NewUserData>(
      func(_id, oldUserData) {
        let newTrades = oldUserData.trades.map<Nat, OldTrade, NewTrade>(
          func(_id, oldTrade) {
            { oldTrade with convictionLevel = 3 };
          }
        );
        {
          trades = newTrades;
          var nextTradeId = oldUserData.nextTradeId;
          var dailyMaxLoss = oldUserData.dailyMaxLoss;
          var accountSize = oldUserData.accountSize;
        };
      }
    );
    { users = newUsers };
  };
};
