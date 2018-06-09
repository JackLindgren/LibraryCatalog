DROP TABLE IF EXISTS `BookUser`;
DROP TABLE IF EXISTS `Book`;
DROP TABLE IF EXISTS `Author`;
DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `Format`;
DROP TABLE IF EXISTS `Country`;
DROP TABLE IF EXISTS `Language`;
DROP TABLE IF EXISTS `BookAuthor`;
DROP TABLE IF EXISTS `SubCategory`;
DROP TABLE IF EXISTS `Category`;

-- `User`
CREATE TABLE `User`
(
 `id`         INT NOT NULL AUTO_INCREMENT ,
 `user_name`  VARCHAR(45) NOT NULL ,
 `user_email` VARCHAR(45) NOT NULL UNIQUE ,

 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- `Format`
CREATE TABLE `Format`
(
 `id`     INT NOT NULL AUTO_INCREMENT ,
 `format` VARCHAR(45) NOT NULL UNIQUE ,

 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- `Country`
CREATE TABLE `Country`
(
 `id`      INT NOT NULL AUTO_INCREMENT ,
 `country` VARCHAR(45) NOT NULL UNIQUE ,
 `region`  VARCHAR(45) NOT NULL ,

 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- `Language`
CREATE TABLE `Language`
(
 `id`              INT NOT NULL AUTO_INCREMENT ,
 `language`        VARCHAR(45) NOT NULL UNIQUE ,
 `language_family` VARCHAR(45) NOT NULL ,

 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- `Author`
CREATE TABLE `Author`
(
 `id`         INT NOT NULL AUTO_INCREMENT ,
 `firstName`  VARCHAR(50) ,
 `lastName`	  VARCHAR(50) NOT NULL ,
 `dob`        DATE ,
 `dod`        DATE ,
 `country_id` INT NOT NULL ,
 `gender`     CHAR(1) ,

 PRIMARY KEY (`id`) ,

 FOREIGN KEY (`country_id`)
 	REFERENCES `Country` (`id`) 
 	ON DELETE CASCADE ,

 CONSTRAINT `AuthorDOB` UNIQUE(`firstName`, `lastName`, `dob`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- `Category`
CREATE TABLE `Category`
(
 `id` INT NOT NULL AUTO_INCREMENT ,
 `name` VARCHAR(100) NOT NULL UNIQUE,

 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- `SubCategory`
CREATE TABLE `SubCategory`
(
 `id` INT NOT NULL AUTO_INCREMENT ,
 `name` VARCHAR(100) NOT NULL UNIQUE,
 `category_id` INT NOT NULL ,

 PRIMARY KEY (`id`) ,

 FOREIGN KEY (`category_id`)
 	REFERENCES `Category` (`id`)
 	ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- `Book`
CREATE TABLE `Book`
(
 `id`           INT NOT NULL AUTO_INCREMENT ,
 `title`        VARCHAR(100) NOT NULL ,
 `year`         INT NOT NULL ,
 `language_id`  INT NOT NULL ,
 `author_id`    INT NOT NULL ,
 `is_anthology` INT NOT NULL DEFAULT 0 ,
 `category_id`  INT ,

 PRIMARY KEY (`id`) ,

 FOREIGN KEY (`language_id`)
 	REFERENCES `Language` (`id`) 
 	ON DELETE CASCADE ,

 FOREIGN KEY (`author_id`)
 	REFERENCES `Author` (`id`) 
 	ON DELETE CASCADE ,

 FOREIGN KEY (`category_id`)
 	REFERENCES `SubCategory` (`id`) 
 	ON DELETE SET NULL ,

 CONSTRAINT `TitleAuthorYear` UNIQUE(`title`, `year`, `author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- `BookUser`
CREATE TABLE `BookUser`
(
 `book_id`    INT NOT NULL ,
 `user_id`    INT NOT NULL ,
 `rating`     INT ,
 `date_added` DATE NOT NULL ,
 `date_read`  DATE ,
 `format_id`  INT NOT NULL ,

 PRIMARY KEY (`book_id`, `user_id`, `format_id`) ,

 FOREIGN KEY (`book_id`)
 	REFERENCES `Book` (`id`) 
 	ON DELETE CASCADE ,

 FOREIGN KEY (`user_id`)
 	REFERENCES `User` (`id`) 
 	ON DELETE CASCADE ,

 FOREIGN KEY (`format_id`)
 	REFERENCES `Format` (`id`)
 	ON DELETE CASCADE 
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- `BookAuthor`
CREATE TABLE `BookAuthor`
(
 `book_id`   INT NOT NULL ,
 `author_id` INT NOT NULL ,

 PRIMARY KEY (`book_id`, `author_id`) ,

 FOREIGN KEY (`book_id`)
 	REFERENCES `Book` (`id`) 
 	ON DELETE CASCADE ,

 FOREIGN KEY (`author_id`)
 	REFERENCES `Author` (`id`)
 	ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;