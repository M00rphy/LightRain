/**
 * Tile layer loader and handler of collisions
 */
;
Quintus.BomberManTileLayers = function (Q) {

    /**
     * Own implementation of a tile layer using tiled json file
     */
    Q.TileLayer.extend("TiledJsonFile", {
        // overridden
        load: function (dataAsset) {
            var fileParts = dataAsset.split(".");
            var fileExt = fileParts[fileParts.length - 1].toLowerCase();

            // okay it is a json so we need to check and pare this
            if (fileExt === "json") {
                var asset = Q.asset(dataAsset);
                var layer = asset.layers[this.p.layerIndex];

                // identify the collision layer by the name
                this.p.isCollisionLayer = (layer.name == 'collision');
                if (this.p.isCollisionLayer == true) {
                    this.p.playerStartPos = [];
                }
                this.p.layerName = layer.name;

                var width = parseInt(layer.width, 10);
                var height = parseInt(layer.height, 10);

                var data = [];
                var idx = 0;
                for (var y = 0; y < height; y++) {
                    data[y] = [];
                    for (var x = 0; x < width; x++) {
                        var tileNum = parseInt(layer.data[idx], 10);
                        if (tileNum >= 6) {
                            tileNum -= 6;
                        } else {
                            tileNum -= 1;
                        }

                        // check if this is one off the playerystartpositions
                        if (this.p.isCollisionLayer == true && tileNum >= 3) {
                            this.p.playerStartPos[tileNum - 3] = {
                                x: (this.p.tileW * x) + (this.p.tileW / 2),
                                y: (this.p.tileH * y) + (this.p.tileH / 2)
                            };
                            tileNum = 0;
                        }

                        data[y].push(tileNum);
                        idx++;
                    }
                }

                this.p.tiles = data;
                this.p.rows = data.length;
                this.p.cols = data[0].length;
                this.p.w = this.p.cols * this.p.tileW;
                this.p.h = this.p.rows * this.p.tileH;
            } else {
                throw "file type not supported";
            }
        },
        collidableTile: function (tileNum) {
            if (this.p.isCollisionLayer == true) {
                return tileNum > 0 && tileNum < 3;
            }
            return tileNum > 0;
        },
        drawableTile: function (tileNum) {
            if (this.p.isCollisionLayer == true) {
                return false;
            }
            return tileNum > 0;
        }
    });
}