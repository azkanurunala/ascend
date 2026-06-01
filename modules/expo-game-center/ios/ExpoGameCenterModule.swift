import ExpoModulesCore
import GameKit
import UIKit

// Dismisses the native Game Center board when the user taps Done.
final class AscendGameCenterDelegate: NSObject, GKGameCenterControllerDelegate {
  func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
    gameCenterViewController.dismiss(animated: true, completion: nil)
  }
}

public class ExpoGameCenterModule: Module {
  private let gcDelegate = AscendGameCenterDelegate()

  // GameKit's authenticateHandler is long-lived and fires repeatedly, so it must
  // NEVER capture an Expo Promise (resolving/releasing it twice crashes). Instead
  // we install the handler exactly once and park any waiting promises here; the
  // handler resolves and clears them. All access is on the main thread.
  private var pendingAuth: [Promise] = []
  private var authHandlerInstalled = false

  private func installAuthHandlerIfNeeded() {
    if authHandlerInstalled { return }
    authHandlerInstalled = true
    GKLocalPlayer.local.authenticateHandler = { [weak self] viewController, _ in
      guard let self = self else { return }
      if let viewController = viewController {
        self.topViewController()?.present(viewController, animated: true, completion: nil)
        return // wait for the next callback after the user signs in / cancels
      }
      let authed = GKLocalPlayer.local.isAuthenticated
      let waiting = self.pendingAuth
      self.pendingAuth.removeAll()
      for promise in waiting { promise.resolve(authed) }
    }
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoGameCenter")

    // Authenticate the local player. Resolves true if signed in. If the player
    // isn't signed in, GameKit hands us a sign-in view controller to present.
    AsyncFunction("authenticate") { (promise: Promise) in
      DispatchQueue.main.async {
        if GKLocalPlayer.local.isAuthenticated {
          promise.resolve(true)
          return
        }
        self.pendingAuth.append(promise)
        self.installAuthHandlerIfNeeded()
      }
    }

    AsyncFunction("isAuthenticated") { () -> Bool in
      return GKLocalPlayer.local.isAuthenticated
    }

    // Submit a score. Game Center keeps the player's best, so submitting every
    // run is safe — it only moves the needle when the score is higher.
    AsyncFunction("submitScore") { (score: Int, leaderboardID: String, promise: Promise) in
      guard GKLocalPlayer.local.isAuthenticated else {
        promise.resolve(false)
        return
      }
      GKLeaderboard.submitScore(
        score,
        context: 0,
        player: GKLocalPlayer.local,
        leaderboardIDs: [leaderboardID]
      ) { error in
        promise.resolve(error == nil)
      }
    }

    // Present Apple's native global leaderboard UI.
    AsyncFunction("presentLeaderboard") { (leaderboardID: String, promise: Promise) in
      DispatchQueue.main.async { [weak self] in
        guard GKLocalPlayer.local.isAuthenticated else {
          promise.resolve(false)
          return
        }
        let vc = GKGameCenterViewController(
          leaderboardID: leaderboardID,
          playerScope: .global,
          timeScope: .allTime
        )
        vc.gameCenterDelegate = self?.gcDelegate
        guard let top = self?.topViewController() else {
          promise.resolve(false)
          return
        }
        top.present(vc, animated: true) {
          promise.resolve(true)
        }
      }
    }

    // Load the top N global scores so they can be rendered in the app's own UI.
    // Returns [{ rank, name, score, me }]. Empty array if not signed in / error.
    AsyncFunction("loadTopScores") { (leaderboardID: String, count: Int, promise: Promise) in
      guard GKLocalPlayer.local.isAuthenticated else {
        promise.resolve([[String: Any]]())
        return
      }
      GKLeaderboard.loadLeaderboards(IDs: [leaderboardID]) { leaderboards, error in
        guard error == nil, let leaderboard = leaderboards?.first else {
          promise.resolve([[String: Any]]())
          return
        }
        let length = max(1, min(count, 100))
        leaderboard.loadEntries(
          for: .global,
          timeScope: .allTime,
          range: NSRange(location: 1, length: length)
        ) { _, entries, _, entriesError in
          guard entriesError == nil else {
            promise.resolve([[String: Any]]())
            return
          }
          let localID = GKLocalPlayer.local.gamePlayerID
          let result: [[String: Any]] = (entries ?? []).map { entry in
            return [
              "rank": entry.rank,
              "name": entry.player.displayName,
              "score": entry.score,
              "me": entry.player.gamePlayerID == localID,
            ]
          }
          promise.resolve(result)
        }
      }
    }
  }

  // Walks to the front-most view controller so we present on top of the RN root.
  private func topViewController() -> UIViewController? {
    let scene = UIApplication.shared.connectedScenes
      .first { $0.activationState == .foregroundActive } as? UIWindowScene
    var root = scene?.keyWindow?.rootViewController
      ?? scene?.windows.first?.rootViewController
    while let presented = root?.presentedViewController {
      root = presented
    }
    return root
  }
}
