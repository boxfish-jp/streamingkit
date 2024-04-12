DROP TABLE IF EXISTS `imagePath`;
CREATE TABLE `imagePath` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `iaddtime` TEXT DEFAULT (datetime('now','localtime')),
  `path` TEXT,
  `prompt` TEXT,
  `negative` TEXT
);
CREATE INDEX `imagePath_iaddtime` ON `imagePath` (`iaddtime`);