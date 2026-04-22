export interface VideossResponse {
  kind: "youtube#videoListResponse";
  etag: string;
  nextPageToken: string;
  prevPageToken: string;
  pageInfo: {
    totalResults: string;
    resultsPerPage: string;
  };
  items: Video[];
}

interface Video {
  kind: "youtube#video";
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: Map<
      string,
      {
        url: string;
        width: string;
        height: string;
      }
    >;
    channelTitle: string;
    tags: [string];
    categoryId: string;
    liveBroadcastContent: string;
    defaultLanguage: string;
    localized: {
      title: string;
      description: string;
    };
    defaultAudioLanguage: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    regionRestriction: {
      allowed: [string];
      blocked: [string];
    };
    contentRating: {
      acbRating: string;
      agcomRating: string;
      anatelRating: string;
      bbfcRating: string;
      bfvcRating: string;
      bmukkRating: string;
      catvRating: string;
      catvfrRating: string;
      cbfcRating: string;
      cccRating: string;
      cceRating: string;
      chfilmRating: string;
      chvrsRating: string;
      cicfRating: string;
      cnaRating: string;
      cncRating: string;
      csaRating: string;
      cscfRating: string;
      czfilmRating: string;
      djctqRating: string;
      ecbmctRating: string;
      eefilmRating: string;
      egfilmRating: string;
      eirinRating: string;
      fcbmRating: string;
      fcoRating: string;
      fmocRating: string;
      fpbRating: string;
      fpbRatingReasons: [string];
      fskRating: string;
      grfilmRating: string;
      icaaRating: string;
      ifcoRating: string;
      ilfilmRating: string;
      incaaRating: string;
      kfcbRating: string;
      kijkwijzerRating: string;
      kmrbRating: string;
      lsfRating: string;
      mccaaRating: string;
      mccypRating: string;
      mcstRating: string;
      mdaRating: string;
      medietilsynetRating: string;
      mekuRating: string;
      mibacRating: string;
      mocRating: string;
      moctwRating: string;
      mpaaRating: string;
      mpaatRating: string;
      mtrcbRating: string;
      nbcRating: string;
      nbcplRating: string;
      nfrcRating: string;
      nfvcbRating: string;
      nkclvRating: string;
      oflcRating: string;
      pefilmRating: string;
      rcnofRating: string;
      resorteviolenciaRating: string;
      rtcRating: string;
      rteRating: string;
      russiaRating: string;
      skfilmRating: string;
      smaisRating: string;
      smsaRating: string;
      tvpgRating: string;
      ytRating: string;
    };
    projection: string;
    hasCustomThumbnail: boolean;
  };
  status: {
    uploadStatus: string;
    failureReason: string;
    rejectionReason: string;
    privacyStatus: string;
    publishAt: string;
    license: string;
    embeddable: boolean;
    publicStatsViewable: boolean;
    madeForKids: boolean;
    selfDeclaredMadeForKids: boolean;
    containsSyntheticMedia: boolean;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    dislikeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
  paidProductPlacementDetails: {
    hasPaidProductPlacement: boolean;
  };
  player: {
    embedHtml: string;
    embedHeight: number;
    embedWidth: number;
  };
  topicDetails: {
    topicIds: [string];
    relevantTopicIds: [string];
    topicCategories: [string];
  };
  recordingDetails: {
    recordingDate: string;
  };
  fileDetails: {
    fileName: string;
    fileSize: number;
    fileType: string;
    container: string;
    videoStreams: [
      {
        widthPixels: string;
        heightPixels: string;
        frameRateFps: number;
        aspectRatio: number;
        codec: string;
        bitrateBps: number;
        rotation: string;
        vendor: string;
      },
    ];
    audioStreams: [
      {
        channelCount: string;
        codec: string;
        bitrateBps: number;
        vendor: string;
      },
    ];
    durationMs: number;
    bitrateBps: number;
    creationTime: string;
  };
  processingDetails: {
    processingStatus: string;
    processingProgress: {
      partsTotal: number;
      partsProcessed: number;
      timeLeftMs: number;
    };
    processingFailureReason: string;
    fileDetailsAvailability: string;
    processingIssuesAvailability: string;
    tagSuggestionsAvailability: string;
    editorSuggestionsAvailability: string;
    thumbnailsAvailability: string;
  };
  suggestions: {
    processingErrors: [string];
    processingWarnings: [string];
    processingHints: [string];
    tagSuggestions: [
      {
        tag: string;
        categoryRestricts: [string];
      },
    ];
    editorSuggestions: [string];
  };
  liveStreamingDetails: {
    actualStartTime: string;
    actualEndTime: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    concurrentViewers: number;
    activeLiveChatId: string;
  };
  localizations: Map<
    string,
    {
      title: string;
      description: string;
    }
  >;
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
