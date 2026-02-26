import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  // define the trade type as in the main actor
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

  type MarketType = {
    #stocks;
    #future;
    #option;
    #cryptocurrency;
    #forex;
  };

  type UserProfile = {
    name : Text;
  };

  type UserData = {
    trades : Map.Map<Nat, Trade>;
    var nextTradeId : Nat;
    var dailyMaxLoss : Float;
    var accountSize : Float;
  };

  type OldActor = {
    users : Map.Map<Principal, UserData>;
    userProfiles : Map.Map<Principal, UserProfile>;
    accessControlState : AccessControl.AccessControlState;
  };

  type NewActor = {
    users : Map.Map<Principal, UserData>;
    userProfiles : Map.Map<Principal, UserProfile>;
    strategies : Map.Map<Principal, Map.Map<Text, Int>>;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    { old with strategies = Map.empty<Principal, Map.Map<Text, Int>>() };
  };
};
