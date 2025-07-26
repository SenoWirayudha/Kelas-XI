package com.komputerkit.recycleviewcardview;

public class Siswa {

    private String nama;
    private String alamat;

    public Siswa(String nama, String alamat) {
        this.alamat = alamat;
        this.nama = nama;
    }

    public String getAlamat() {
        return alamat;
    }

    public void setAlamat(String alamat) {
        this.alamat = alamat;
    }

    public String getNama() {
        return nama;
    }

    public void setNama(String nama) {
        this.nama = nama;
    }
}
