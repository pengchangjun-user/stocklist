class AppGlobal {
    constructor() {
        // 当跳转回来的时候，原来的tab是那个
        this.currentKey = '';
        // 子级的tab
        this.currentChildKey = '';
        // 导入文件的期数
        this.globalAllPeriod = [];
        // 股东性质的基础数据，app一打开的时候就去读取这个文件
        this.characterObj = {};
        // 只读取一次
        this.readCharacterFlag = 0;
    }
}
const appGlobal = new AppGlobal()

export default appGlobal