import string
import random
from PIL import Image, ImageDraw, ImageFont


def random_string(length=4):
    if not isinstance(length, int):
        raise TypeError('length must be int')

    chars = string.ascii_letters + string.digits
    return ''.join(random.sample(chars, length))


def generate_catcha_image(width=80, height=30, font_size=27, font_path='', length=4):
    image = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    from django.conf import settings
    if not font_path:
        font_path = "static/fonts/Arial.ttf"
    font = ImageFont.truetype(font_path, font_size)
    random_str = random_string(length)
    x, y = 1, 0
    for i in range(length):
        color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        draw.text((x, y), random_str[i], font=font, fill=color)
        x += font_size * 0.7
    for _ in range(random.randint(0, 7)):
        color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        draw.point((random.randint(0, width), random.randint(0, height)), fill=color)

    for _ in range(random.randint(0, 4)):
        color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        draw.line(
            (random.randint(0, width), random.randint(0, height), random.randint(0, width), random.randint(0, height)),
            fill=color)

    image.save('test.png')
    image.show()
    return image, random_str


if __name__ == '__main__':
    generate_catcha_image()
