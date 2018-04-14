-- ****************** SqlDBM: MySQL ******************;
-- ***************************************************;
DROP TABLE `BookUser`;
DROP TABLE `Book`;
DROP TABLE `Author`;
DROP TABLE `User`;
DROP TABLE `Format`;
DROP TABLE `Country`;
DROP TABLE `Language`;

-- ************************************** `User`
CREATE TABLE `User`
(
 `id`         INT NOT NULL AUTO_INCREMENT ,
 `user_name`  VARCHAR(45) NOT NULL ,
 `user_email` VARCHAR(45) NOT NULL UNIQUE ,

 PRIMARY KEY (`id`)
);

-- ************************************** `Format`
CREATE TABLE `Format`
(
 `id`     INT NOT NULL AUTO_INCREMENT ,
 `format` VARCHAR(45) NOT NULL UNIQUE ,

 PRIMARY KEY (`id`)
);

-- ************************************** `Country`
CREATE TABLE `Country`
(
 `id`      INT NOT NULL AUTO_INCREMENT ,
 `country` VARCHAR(45) NOT NULL UNIQUE ,
 `region`  VARCHAR(45) NOT NULL ,

 PRIMARY KEY (`id`)
);

-- ************************************** `Language`
CREATE TABLE `Language`
(
 `id`              INT NOT NULL AUTO_INCREMENT ,
 `language`        VARCHAR(45) NOT NULL UNIQUE ,
 `language_family` VARCHAR(45) NOT NULL ,

 PRIMARY KEY (`id`)
);

-- ************************************** `Author`
CREATE TABLE `Author`
(
 `id`         INT NOT NULL AUTO_INCREMENT ,
 `firstName`  VARCHAR(100) NOT NULL ,
 `lastName`	  VARCHAR(100) NOT NULL ,
 `dob`        DATE ,
 `country_id` INT NOT NULL ,

 PRIMARY KEY (`id`),
 KEY `fkIdx_19` (`country_id`),
 CONSTRAINT `FK_19` FOREIGN KEY `fkIdx_19` (`country_id`) REFERENCES `Country` (`id`),
 CONSTRAINT `AuthorDOB` UNIQUE(`firstName`, `lastName`, `dob`)
);

-- ************************************** `Book`
CREATE TABLE `Book`
(
 `id`          INT NOT NULL AUTO_INCREMENT ,
 `title`       VARCHAR(100) NOT NULL ,
 `year`        INT NOT NULL ,
 `language_id` INT NOT NULL ,
 `author_id`   INT NOT NULL ,

 PRIMARY KEY (`id`),
 KEY `fkIdx_29` (`language_id`),
 CONSTRAINT `FK_29` FOREIGN KEY `fkIdx_29` (`language_id`) REFERENCES `Language` (`id`),
 KEY `fkIdx_33` (`author_id`),
 CONSTRAINT `FK_33` FOREIGN KEY `fkIdx_33` (`author_id`) REFERENCES `Author` (`id`),
 CONSTRAINT `TitleAuthorYear` UNIQUE(`title`, `year`, `author_id`)
);

-- ************************************** `BookUser`
CREATE TABLE `BookUser`
(
 `book_id`    INT NOT NULL ,
 `user_id`    INT NOT NULL ,
 `rating`     INT ,
 `date_added` DATE NOT NULL ,
 `date_read`  DATE ,
 `format_id`  INT NOT NULL ,

 PRIMARY KEY (`book_id`, `user_id`),
 KEY `fkIdx_60` (`book_id`),
 CONSTRAINT `FK_60` FOREIGN KEY `fkIdx_60` (`book_id`) REFERENCES `Book` (`id`),
 KEY `fkIdx_65` (`user_id`),
 CONSTRAINT `FK_65` FOREIGN KEY `fkIdx_65` (`user_id`) REFERENCES `User` (`id`),
 KEY `fkIdx_74` (`format_id`),
 CONSTRAINT `FK_74` FOREIGN KEY `fkIdx_74` (`format_id`) REFERENCES `Format` (`id`)
);