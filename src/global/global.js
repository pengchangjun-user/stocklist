class AppGlobal {
    constructor() {
        // 当跳转回来的时候，原来的tab是那个
        this.currentKey = '';
        // 子级的tab
        this.currentChildKey = '';
        // 导入文件的期数
        this.globalAllPeriod = [];
    }
}
const appGlobal = new AppGlobal()

export default appGlobal