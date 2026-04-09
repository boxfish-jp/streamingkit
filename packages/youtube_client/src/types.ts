export interface LiveBroadcastsResponse {
  kind: "youtube#liveBroadcastListResponse";
  etag: string;
  nextPageToken: string;
  prevPageToken: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: liveBroadcast[];
}

interface liveBroadcast {
  kind: "youtube#liveBroadcast";
  etag: string;
  id: string;
  snippet: {
    channelId: string;
    title: string;
    description: string;
    thumbnails: Map<
      string,
      {
        url: string;
        width: number;
        height: number;
      }
    >;
    isDefaultBroadcast: boolean;
    liveChatId: string;
  };
  status: {
    lifeCycleStatus: string;
    privacyStatus: string;
    recordingStatus: string;
    madeForKids: string;
    selfDeclaredMadeForKids: string;
  };
  contentDetails: {
    boundStreamId: string;
    monitorStream: {
      enableMonitorStream: boolean;
      broadcastStreamDelayMs: number;
      embedHtml: string;
    };
    enableEmbed: boolean;
    enableDvr: boolean;
    recordFromStart: boolean;
    enableClosedCaptions: boolean;
    closedCaptionsType: string;
    projection: string;
    enableLowLatency: boolean;
    latencyPreference: boolean;
    enableAutoStart: boolean;
    enableAutoStop: boolean;
  };
  statistics: {
    totalChatCount: number;
  };
  monetizationDetails: {
    cuepointSchedule: {
      enabled: boolean;
      scheduleStrategy: string;
      repeatIntervalSecs: number;
    };
  };
}

export interface LiveChatResponse {
  kind: string;
  etag: string;
  nextPageToken: string;
  pollingIntervalMillis: number;
  offlineAt?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: LiveChatMessage[];
}

type LiveChatMessage = {
  kind: "youtube#liveChatMessage";
  id: string;
  snippet: {
    type: string;
    liveChatId: string;
    authorChannelId: string;
    hasDisplayContent: boolean;
    displayMessage: string;
    fanFundingEventDetails: {
      amountMicros: number;
      currency: string;
      amountDisplayString: string;
      userComment: string;
    };
    textMessageDetails: {
      messageText: string;
    };
    messageDeletedDetails: {
      deletedMessageId: string;
    };
    userBannedDetails: {
      bannedUserDetails: {
        channelId: string;
        channelUrl: string;
        displayName: string;
        profileImageUrl: string;
      };
      banType: string;
      banDurationSeconds: number;
    };
    memberMilestoneChatDetails: {
      userComment: string;
      memberMonth: number;
      memberLevelName: string;
    };
    newSponsorDetails: {
      memberLevelName: string;
      isUpgrade: boolean;
    };
    superChatDetails: {
      amountMicros: number;
      currency: string;
      amountDisplayString: string;
      userComment: string;
      tier: number;
    };
    superStickerDetails: {
      superStickerMetadata: {
        stickerId: string;
        altText: string;
        language: string;
      };
      amountMicros: number;
      currency: string;
      amountDisplayString: string;
      tier: number;
    };
    pollDetails: {
      metadata: {
        options: {
          optionText: string;
          tally: string;
        };
        questionText: string;
      };
    };
    membershipGiftingDetails: {
      giftMembershipsCount: number;
      giftMembershipsLevelName: string;
    };
    giftMembershipReceivedDetails: {
      memberLevelName: string;
      gifterChannelId: string;
      associatedMembershipGiftingMessageId: string;
    };
    giftEventDetails: {
      giftMetadata: {
        jewelsAmount: number;
        giftName: string;
        giftUrl: string;
        giftDuration: object;
        seconds: number;
        nanos: number;
        hasVisualEffect: boolean;
        comboCount: number;
        altText: string;
        language: string;
      };
    };
  };
  authorDetails: {
    channelId: string;
    channelUrl: string;
    displayName: string;
    profileImageUrl: string;
    isVerified: boolean;
    isChatOwner: boolean;
    isChatSponsor: boolean;
    isChatModerator: boolean;
  };
};
