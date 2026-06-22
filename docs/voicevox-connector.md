voicevox_connectorという新しいプロセス(app)を作ろうと思う。
言語はこれまでと同様にNode.js + TypeScriptで、このモノレポ内のappの中のvoicevox_connectorとして作る。

Rest APIサーバーを立てる。  サーバーを0.0.0.0:50020で立ち上げて、ルートのPOSTでクエリパラメータとしてtextとchannelとcharacterを受け取る。
textはエンコードされた文字列とchannel、characterは数字を受け取る。

voicevoxのサーバーが0.0.0.0:50021に待ち受けているので、POSTリクエストが来たら、voicevoxの音声合成を行う。
音声合成時に必要なテキストとキャラクターのidはtext,characterをそれぞれ当てはめてリクエストを行う。  
音声が合成されたら、SynthesizedMessage {
  type: "synthesized";
  buffer: Buffer;
  channel: number;
}
をhubに送信する。hubはpackagesのsocketClientを使って送信する。
