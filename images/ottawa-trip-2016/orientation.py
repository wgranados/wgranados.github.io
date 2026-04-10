from PIL.ExifTags import TAGS
from PIL import Image

image_file = "20160218_193254.jpg"
im = Image.open(image_file)
im.transpose(Image.ROTATE_270).save(image_file)
