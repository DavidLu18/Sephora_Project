import os
import pandas as pd
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

FILE_PATH = "locations/data/danh-sach-3321-xa-phuong.xlsx"


def load_data():
    df = pd.read_excel(FILE_PATH)
    df.columns = [col.strip() for col in df.columns]
    return df


@api_view(["GET"])
def get_cities(request):
    df = load_data()

    cities = (
        df[["Mã TP", "Tỉnh / Thành Phố"]]
        .drop_duplicates()
        .sort_values(by="Tỉnh / Thành Phố")   # ⬅ SẮP XẾP THEO NAME
    )

    data = [
        {"code": int(row["Mã TP"]), "name": row["Tỉnh / Thành Phố"]}
        for _, row in cities.iterrows()
    ]
    return Response(data)


@api_view(["GET"])
def get_wards_by_city(request, city_code):
    df = load_data()

    wards = (
        df[df["Mã TP"] == int(city_code)][["Mã", "Tên"]]
        .sort_values(by="Tên")   # ⬅ SẮP XẾP THEO NAME
    )

    data = [
        {"code": int(row["Mã"]), "name": row["Tên"]}
        for _, row in wards.iterrows()
    ]
    return Response(data)
